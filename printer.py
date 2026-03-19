import requests
from supabase import create_client, Client
from datetime import datetime

SUPABASE_URL = "https://SEU-PROJETO.supabase.co"
SUPABASE_KEY = "SUA-CHAVE-ANON-OU-SERVICE-ROLE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ZABBIX_URL = 'http://127.0.0.1/zabbix/api_jsonrpc.php'
USER = 'seu_usuario_zabbix'
PASSWORD = 'sua_senha_zabbix'

def obter_token_zabbix():
    payload = {
        "jsonrpc": "2.0",
        "method": "user.login",
        "params": {"user": USER, "password": PASSWORD},
        "id": 1,
        "auth": None
    }
    try:
        resp = requests.post(ZABBIX_URL, json=payload).json()
        return resp.get('result')
    except Exception as e:
        print(f"Erro ao conectar no Zabbix: {e}")
        return None

def buscar_contador_zabbix(token, host_id):
    payload = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
            "output": ["lastvalue"],
            "hostids": host_id,
            "search": {"name": "Contador"} # Ajuste o nome do item
        },
        "id": 2,
        "auth": token
    }
    resp = requests.post(ZABBIX_URL, json=payload).json()
    itens = resp.get('result', [])
    return int(itens[0]['lastvalue']) if itens else None

def main():
    agora = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    print(f"\n[{agora}] Iniciando rotina de coleta via Crontab...")
    
    token = obter_token_zabbix()
    if not token:
        print("Falha de autenticação no Zabbix. Abortando.")
        return

    try:
        resposta_db = supabase.table("tabelaImpressoras").select("id, hostId, modeloImpressora").execute()
        impressoras = resposta_db.data
    except Exception as e:
        print(f"Erro ao ler banco de dados: {e}")
        return

    for imp in impressoras:
        if not imp['hostId']: continue 

        valor_contador = buscar_contador_zabbix(token, imp['hostId'])
        
        if valor_contador is not None:
            dados = {
                "idImpressora": imp['id'],
                "qtdContador": valor_contador
            }
            supabase.table("tabelaContador").insert(dados).execute()
            print(f"✅ Impressora ID {imp['id']} ({imp['modeloImpressora']}) - Contador salvo: {valor_contador}")
        else:
            print(f"⚠️ Aviso: Contador não encontrado para a impressora ID {imp['id']}")

if __name__ == "__main__":
    main()