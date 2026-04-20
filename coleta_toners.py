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
    print("❌ ERRO CRÍTICO: Chaves do Supabase não encontradas.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ZABBIX_URL = os.getenv("ZABBIX_URL", "http://127.0.0.1/zabbix/api_jsonrpc.php")
ZABBIX_TOKEN = os.getenv("ZABBIX_TOKEN")

# ==========================================
# MAPEAMENTO DOS ITENS E CORES
# ==========================================
MAPA_TONERS = {
    "Toner Life": "Preto",                                 # Kyocera
    "Drum Unit % Life Remaining": "Preto",                 # Brother
    "Cartridge toner level % - black": "Preto",            # Xerox C505
    "Cartridge toner level % - cyan": "Ciano",             # Xerox C505
    "Cartridge toner level % - magenta": "Magenta",        # Xerox C505
    "Cartridge toner level % - yellow": "Amarelo"          # Xerox C505
}

# ==========================================
# FUNÇÕES
# ==========================================
def buscar_toners_zabbix(zabbix_id):
    """Busca os itens no Zabbix e retorna uma lista com as cores e valores."""
    payload = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
            "output": ["lastvalue", "name", "state"],
            "hostids": zabbix_id,
            "filter": {
                "name": list(MAPA_TONERS.keys())
            }
        },
        "id": 1,
        "auth": ZABBIX_TOKEN
    }
    
    toners_encontrados = []
    try:
        resp = requests.post(ZABBIX_URL, json=payload).json()
        itens = resp.get('result', [])
        
        for item in itens:
            valor_bruto = item.get('lastvalue')
            estado_item = item.get('state')
            nome_item = item.get('name')
            
            if estado_item != '1' and valor_bruto:
                cor_definida = MAPA_TONERS.get(nome_item)
                
                toners_encontrados.append({
                    "cor": cor_definida,
                    "valor": round(float(valor_bruto)),
                    "nome_zabbix": nome_item
                })
                
        return toners_encontrados
    except Exception as e:
        print(f"❌ Erro ao consultar toner para o Zabbix ID {zabbix_id}: {e}")
        return []

# ==========================================
# ROTINA PRINCIPAL
# ==========================================
def main():
    agora = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    print(f"\n[{agora}] Iniciando rotina de coleta de TONERS...")
    
    # 1. Busca todas as impressoras no banco (Agora trazendo o endereco_ip também)
    try:
        resposta_db = supabase.table("tabelaImpressoras").select("id, zabbix_id, modelo_impressora, nome_maquina, endereco_ip").execute()
        impressoras_db = resposta_db.data
    except Exception as e:
        print(f"❌ Erro ao ler tabelaImpressoras no Supabase: {e}")
        return

    # 2. Varre as impressoras
    for imp in impressoras_db:
        ip_impressora = str(imp.get('endereco_ip', '')).strip()
        nome_impressora = imp.get('nome_maquina') or f"Impressora ID {imp['id']}"
        
        # Ignora as Konicas baseando-se no IP (Cobre o IP completo ou apenas o último octeto)
        if ip_impressora in ['192.168.234.227', '192.168.234.228', '227', '228']:
            print(f"⏭️ Pulando '{nome_impressora}' (IP: {ip_impressora}) - Regra de Exceção (Konica).")
            continue
            
        toners_da_impressora = buscar_toners_zabbix(str(imp['zabbix_id']))
        
        if not toners_da_impressora:
            print(f"⚠️ AVISO: Nenhum toner retornado para '{nome_impressora}' (IP: {ip_impressora}). Impressora offline ou modelo não mapeado?")
            continue
            
        # 3. Insere cada toner encontrado
        for toner in toners_da_impressora:
            dados_toner = {
                "id_impressora": imp['id'],
                "cor_toner": toner['cor'],
                "qtd_toner": toner['valor'],
                "unidade_medida": "%"
            }
            
            try:
                supabase.table("tabelaToner").insert(dados_toner).execute()
                print(f"✅ SUCESSO: '{nome_impressora}' | Cor: {toner['cor']} | Nível: {toner['valor']}%")
            except Exception as e:
                print(f"❌ Erro ao salvar {toner['cor']} da '{nome_impressora}': {e}")

    print(f"\n[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Rotina de toners finalizada.")

if __name__ == "__main__":
    main()