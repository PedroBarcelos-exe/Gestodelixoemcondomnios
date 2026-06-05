import sys
from dotenv import load_dotenv
import os

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
# USAR A SERVICE KEY (ADMIN) PARA VERIFICAR CONTROLE E BYPASS DE RLS
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

try:
    from supabase import create_client
    # Inicializa com a chave privada de administrador para bypassar o RLS
    client = create_client(supabase_url, supabase_service_key)
    
    # Contar registros
    profiles_count = client.table("profiles").select("id", count="exact").execute()
    descarte_count = client.table("registros_descarte").select("id", count="exact").execute()
    agendamento_count = client.table("agendamentos_volumosos").select("id", count="exact").execute()
    tarefas_count = client.table("tarefas_zelador").select("id", count="exact").execute()
    
    print("[GREENBIN STATUS DO BANCO DE DADOS - VIA ADMIN SERVICE KEY]")
    print(f"Total de Perfis Criados: {profiles_count.count}")
    print(f"Total de Descartes Realistas (Seed): {descarte_count.count}")
    print(f"Total de Agendamentos de Volumosos: {agendamento_count.count}")
    print(f"Total de Tarefas do Zelador: {tarefas_count.count}")
    
    if descarte_count.count > 0:
        print("\nMARAVILHA! Os dados estao 100% gravados no banco de dados!")
    else:
        print("\nOps, o banco continua zerado. Tem algo estranho.")
except Exception as e:
    print(f"Erro ao verificar contagem: {e}", file=sys.stderr)
