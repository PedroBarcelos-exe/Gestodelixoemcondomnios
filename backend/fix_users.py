import sys, os
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client
db = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Adicionar profile para teste@greenbin.com
uid_teste = '07198bf6-bd1b-41db-8e27-dad53b2a6c98'
try:
    db.table('profiles').upsert({
        'id': uid_teste,
        'nome': 'Carlos Teste',
        'email': 'teste@greenbin.com',
        'role': 'morador',
        'apartamento': '105',
        'bloco': 'A'
    }).execute()
    print('Profile teste@greenbin.com OK')
except Exception as e:
    print('Erro:', e)

# Listar moradores
p = db.table('profiles').select('id, email, role, nome, apartamento').eq('role', 'morador').execute()
print(f'\nTotal moradores: {len(p.data)}')
for m in p.data:
    print(f"  {m['email']} - {m['nome']} - Apto {m['apartamento']}")

# Mostrar sindico e zelador
s = db.table('profiles').select('id, email, role, nome').in_('role', ['sindico', 'zelador']).execute()
print(f'\nSindico/Zelador:')
for u in s.data:
    print(f"  [{u['role']}] {u['email']} -> {u['id']}")
