from datetime import date, timedelta
from app.database import get_supabase_admin


def get_dashboard_stats(user_id: str) -> dict:
    db = get_supabase_admin()
    today = date.today()
    first_day = today.replace(day=1)

    # Registros de descarte do mês
    registros = db.table("registros_descarte") \
        .select("*") \
        .eq("morador_id", user_id) \
        .gte("data", first_day.isoformat()) \
        .execute()

    total = len(registros.data) if registros.data else 0
    corretos = sum(1 for r in (registros.data or []) if r.get("correto"))
    meta_pct = round((corretos / total * 100) if total > 0 else 0, 1)

    # Agendamentos pendentes
    agendamentos = db.table("agendamentos_volumosos") \
        .select("id") \
        .eq("morador_id", user_id) \
        .eq("status", "pendente") \
        .execute()

    pendentes = len(agendamentos.data) if agendamentos.data else 0

    # Próxima coleta
    proximas = db.table("coletas") \
        .select("*") \
        .gte("data", today.isoformat()) \
        .order("data") \
        .limit(1) \
        .execute()

    proxima = proximas.data[0] if proximas.data else None

    return {
        "meta_mensal_pct": meta_pct,
        "descartes_corretos": corretos,
        "total_descartes": total,
        "agendamentos_pendentes": pendentes,
        "proxima_coleta": proxima,
    }


def get_proximas_coletas(limit: int = 7) -> list:
    db = get_supabase_admin()
    today = date.today()
    result = db.table("coletas") \
        .select("*") \
        .gte("data", today.isoformat()) \
        .order("data") \
        .limit(limit) \
        .execute()
    return result.data or []


def get_agendamentos(user_id: str) -> list:
    db = get_supabase_admin()
    result = db.table("agendamentos_volumosos") \
        .select("*") \
        .eq("morador_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return result.data or []


def create_agendamento(user_id: str, data: dict) -> dict:
    db = get_supabase_admin()
    payload = {**data, "morador_id": user_id, "status": "pendente"}
    result = db.table("agendamentos_volumosos").insert(payload).execute()
    if not result.data:
        raise Exception("Erro ao criar agendamento")
    return result.data[0]


def get_impacto_stats(user_id: str) -> dict:
    db = get_supabase_admin()
    registros = db.table("registros_descarte") \
        .select("tipo, peso_kg, correto, data") \
        .eq("morador_id", user_id) \
        .execute()

    dados = registros.data or []
    total_kg = sum(r.get("peso_kg") or 0 for r in dados)
    co2_evitado = round(total_kg * 0.5, 2)  # estimativa: 0.5kg CO2 por kg reciclado
    por_tipo = {}
    for r in dados:
        tipo = r.get("tipo", "outro")
        por_tipo[tipo] = por_tipo.get(tipo, 0) + (r.get("peso_kg") or 0)

    return {
        "total_kg_descartados": round(total_kg, 2),
        "co2_evitado_kg": co2_evitado,
        "arvores_equivalentes": round(co2_evitado / 21, 2),
        "por_tipo": por_tipo,
        "total_registros": len(dados),
    }


def registrar_descarte(user_id: str, data: dict) -> dict:
    db = get_supabase_admin()
    payload = {**data, "morador_id": user_id}
    result = db.table("registros_descarte").insert(payload).execute()
    if not result.data:
        raise Exception("Erro ao registrar descarte")
    return result.data[0]
