"""Cria os usuários de teste no Supabase Auth e sincroniza com profiles."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_KEY")
client = create_client(url, service_key)

USUARIOS = [
    {"email": "sindico@greenbin.com",  "password": "Greenbin@123", "nome": "Dr. Lucas Neto",  "role": "sindico",  "apartamento": None,   "bloco": None},
    {"email": "zelador@greenbin.com",  "password": "Greenbin@123", "nome": "Seu Francisco",   "role": "zelador",  "apartamento": None,   "bloco": None},
    {"email": "maria@greenbin.com",    "password": "Greenbin@123", "nome": "Maria Souza",      "role": "morador",  "apartamento": "101",  "bloco": "A"},
    {"email": "joao@greenbin.com",     "password": "Greenbin@123", "nome": "João Cabral",      "role": "morador",  "apartamento": "202",  "bloco": "B"},
]

for u in USUARIOS:
    try:
        # Criar usuário no Supabase Auth usando admin API
        resp = client.auth.admin.create_user({
            "email": u["email"],
            "password": u["password"],
            "email_confirm": True,
        })
        auth_id = resp.user.id
        print(f"[Auth criado] {u['email']} → {auth_id}")

        # Upsert no profiles com o ID real do Auth
        client.table("profiles").upsert({
            "id": auth_id,
            "nome": u["nome"],
            "email": u["email"],
            "role": u["role"],
            "apartamento": u["apartamento"],
            "bloco": u["bloco"],
        }).execute()
        print(f"[Profile sync] {u['email']} OK")

    except Exception as e:
        err = str(e)
        if "already been registered" in err or "already exists" in err:
            print(f"[Já existe] {u['email']} — tentando atualizar senha...")
            try:
                # Buscar usuário existente
                existing = client.auth.admin.list_users()
                auth_user = next((x for x in existing if x.email == u["email"]), None)
                if auth_user:
                    client.auth.admin.update_user_by_id(auth_user.id, {"password": u["password"]})
                    print(f"[Senha atualizada] {u['email']}")
                    # Garantir profile sincronizado
                    client.table("profiles").upsert({
                        "id": auth_user.id,
                        "nome": u["nome"],
                        "email": u["email"],
                        "role": u["role"],
                        "apartamento": u["apartamento"],
                        "bloco": u["bloco"],
                    }).execute()
                    print(f"[Profile sync] {u['email']} OK")
            except Exception as e2:
                print(f"[Erro ao atualizar] {u['email']}: {e2}")
        else:
            print(f"[Erro] {u['email']}: {e}")

print("\nPronto! Senha padrão de todos: Greenbin@123")
