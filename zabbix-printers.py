#! /usr/bin/env python3
import requests
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# ==========================================
# INICIALIZAÇÃO E .ENV
# ==========================================
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
caminho_env = os.path.join(diretorio_atual, '.env')
load_dotenv(caminho_env, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERRO CRÍTICO: Chaves do Supabase não encontradas. Verifique o .env!")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ZABBIX_URL = os.getenv("ZABBIX_URL", "http://127.0.0.1/zabbix/api_jsonrpc.php")
ZABBIX_TOKEN = os.getenv("ZABBIX_TOKEN")

NOME_GRUPO_ZABBIX = "IMPRESSORA"

NOMES_DOS_CONTADORES = [
    "Contador Total",          # Kyocera M3655idn
    "Pages printed - total",   # Xerox C505s
    "Page Counter",            # Brother L6902W e L6912W
    "TotalPrits"               # Konica 558e e 645e
]

# ==========================================
# FUNÇÕES DO ZABBIX
# ==========================================
def buscar_id_grupo_zabbix(nome_grupo):
    payload = {
        "jsonrpc": "2.0",
        "method": "hostgroup.get",
        "params": {
            "output": ["groupid"],
            "filter": {"name": [nome_grupo]}
        },
        "id": 1,
        "auth": ZABBIX_TOKEN
    }
    try:
        resposta_bruta = requests.post(ZABBIX_URL, json=payload).json()
        
        # === MÁGICA DO DEBUG ===
        # Se o Zabbix retornar um erro, nós pegamos a mensagem exata dele!
        if 'error' in resposta_bruta:
            print(f"\n❌ O Zabbix bloqueou o pedido!")
            print(f"Motivo detalhado do Zabbix: {resposta_bruta['error']['data']}")
            return None
            
        grupos = resposta_bruta.get('result', [])
        return grupos[0]['groupid'] if grupos else None
        
    except Exception as e:
        print(f"❌ Erro interno no Python: {e}")
        return None

def buscar_hosts_zabbix(group_id):
    """Busca hosts trazendo também as Interfaces (para o IP) e o Inventário (para o Modelo)."""
    payload = {
        "jsonrpc": "2.0",
        "method": "host.get",
        "params": {
            "output": ["hostid", "name"],
            "selectInterfaces": ["ip"],
            "selectInventory": ["hardware", "model", "type"],
            "groupids": group_id
        },
        "id": 2,
        "auth": ZABBIX_TOKEN
    }
    try:
        resp = requests.post(ZABBIX_URL, json=payload).json()
        return resp.get('result', [])
    except Exception as e:
        print(f"❌ Erro ao buscar lista de hosts no Zabbix: {e}")
        return []

def buscar_contador_zabbix(zabbix_id):
    payload = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
            "output": ["lastvalue", "name"],
            "hostids": zabbix_id,
            "filter": {"name": NOMES_DOS_CONTADORES}
        },
        "id": 3,
        "auth": ZABBIX_TOKEN
    }
    try:
        resp = requests.post(ZABBIX_URL, json=payload).json()
        itens = resp.get('result', [])
        if itens:
            return int(itens[0]['lastvalue']), itens[0]['name']
        return None, None
    except Exception as e:
        print(f"❌ Erro ao consultar contador para o Zabbix ID {zabbix_id}: {e}")
        return None, None

# ==========================================
# FUNÇÃO DE TRATAMENTO DE DADOS (PARSER)
# ==========================================
def tratar_dados_nova_impressora(host):
    """Pega os dados brutos do Zabbix e converte para o padrão do Supabase."""
    # 1. Tratar o IP (Pegar apenas os últimos 3 dígitos)
    endereco_ip = None
    interfaces = host.get('interfaces', [])
    if interfaces and 'ip' in interfaces[0]:
        ip_completo = interfaces[0]['ip'] # Ex: 192.168.234.234
        ultimo_octeto = ip_completo.split('.')[-1]
        if ultimo_octeto.isdigit():
            endereco_ip = int(ultimo_octeto)

    # 2. Tratar Nome da Máquina (Ex: "234.234 IMPUFGP" -> "IMPUFGP")
    nome_host = host.get('name', '')
    nome_maquina = nome_host.split()[-1] if " " in nome_host else nome_host

    # 3. Identificar o Modelo Limpo pelo Inventário
    inv = host.get('inventory') or {}
    # Junta os campos de hardware, model e type que vêm do Zabbix
    texto_inventario = str(inv.get('hardware', '')) + str(inv.get('model', '')) + str(inv.get('type', ''))
    texto_inventario = texto_inventario.upper()
    
    modelo_limpo = "Outro"
    if "M3655" in texto_inventario: modelo_limpo = "M3655idn"
    elif "L6912" in texto_inventario: modelo_limpo = "L6912"
    elif "L6902" in texto_inventario: modelo_limpo = "L6902"
    elif "558E" in texto_inventario or "558" in texto_inventario: modelo_limpo = "558E"
    elif "645E" in texto_inventario or "645" in texto_inventario: modelo_limpo = "645E"
    elif "C505" in texto_inventario: modelo_limpo = "C505S"

    return {
        "zabbix_id": str(host['hostid']),
        "modelo_impressora": modelo_limpo,
        "endereco_ip": endereco_ip,
        "nome_maquina": nome_maquina
    }

# ==========================================
# ROTINA PRINCIPAL
# ==========================================
def main():
    agora = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    print(f"\n[{agora}] Iniciando rotina de verificação e coleta...")
    
    if not ZABBIX_TOKEN:
        print("❌ ERRO: ZABBIX_TOKEN não encontrado no arquivo .env.")
        return

    print(f"-> Localizando o grupo '{NOME_GRUPO_ZABBIX}' no Zabbix...")
    id_grupo = buscar_id_grupo_zabbix(NOME_GRUPO_ZABBIX)
    if not id_grupo:
        print("❌ Grupo não encontrado. Abortando.")
        return

    print(f"-> Sincronizando equipamentos...")
    hosts_zabbix = buscar_hosts_zabbix(id_grupo)
        
        # === MÁGICA DO DEBUG PARA O SUPABASE ===
    try:
        print("-> A tentar ler a tabelaImpressoras no Supabase...")
        resposta_db = supabase.table("tabelaImpressoras").select("id, zabbix_id, modelo_impressora, endereco_ip").execute()
        impressoras_db = resposta_db.data
        print(f"   ✅ Leitura com sucesso! Foram encontradas {len(impressoras_db)} impressoras na base de dados.")
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO NO SUPABASE!")
        print(f"Detalhe do erro: {e}")
        print(f"Tipo de erro: {type(e).__name__}")
        print("DICA: Verifica se o nome da tabela está exatamente igual no painel do Supabase e se estás a usar a chave 'service_role'.")
        return

    mapa_impressoras = {str(imp['zabbix_id']): imp for imp in impressoras_db if imp.get('zabbix_id')}

    # ==========================================
    # CADASTRO DE NOVAS IMPRESSORAS
    # ==========================================
    for host in hosts_zabbix:
        z_id = str(host['hostid'])
        if z_id not in mapa_impressoras:
            # Chama a nossa nova função que "limpa" os dados
            dados_nova_impressora = tratar_dados_nova_impressora(host)
            
            print(f"➕ Nova impressora: {dados_nova_impressora['nome_maquina']}. Cadastrando no banco...")
            
            try:
                resp_insert = supabase.table("tabelaImpressoras").insert(dados_nova_impressora).execute()
                if resp_insert.data:
                    nova_imp_salva = resp_insert.data[0]
                    mapa_impressoras[z_id] = nova_imp_salva
            except Exception as e:
                print(f"   ❌ Erro ao cadastrar impressora: {e}")


    # ==========================================
    # COLETA DOS CONTADORES
    # ==========================================
    print("\n-> Iniciando a coleta de contadores...")
    for z_id, imp in mapa_impressoras.items():
        
        # Cria variáveis blindadas contra o KeyError
        nome_seguro = imp.get('nome_maquina') or "Sem Nome"
        ip_seguro = imp.get('endereco_ip') or "IP Desconhecido"
        modelo_seguro = imp.get('modelo_impressora') or "Modelo Desconhecido"
        
        valor_contador, nome_item = buscar_contador_zabbix(z_id)
        
        # Garante que o contador não é nulo E é maior que 0
        if valor_contador is not None and valor_contador > 0:
            dados_contador = {
                "id_impressora": imp['id'],
                "qtd_contador": valor_contador
            }
            
            try:
                supabase.table("tabelaContador").insert(dados_contador).execute()
                print(f"✅ SUCESSO: '{nome_seguro}' (IP: {ip_seguro}) [{nome_item}] - Contador: {valor_contador}")
            except Exception as e:
                 print(f"❌ Erro ao salvar contador da '{nome_seguro}' (IP: {ip_seguro}): {e}")
                 
        else:
            # Pula suavemente sem dar erro de KeyError
            print(f"⚠️ AVISO: Impressora '{nome_seguro}' (IP: {ip_seguro}) offline ou contador zerado. Pulando...")
            continue

    print(f"\n[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Rotina finalizada com sucesso.")

if __name__ == "__main__":
    main()