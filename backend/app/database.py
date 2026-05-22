from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Cliente público (usa anon key - respeita Row Level Security)
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key,
)

# Cliente admin (usa service key - ignora RLS para operações internas)
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key,
)


def get_supabase() -> Client:
    """Retorna cliente Supabase público."""
    return supabase


def get_supabase_admin() -> Client:
    """Retorna cliente Supabase admin (sem RLS)."""
    return supabase_admin
