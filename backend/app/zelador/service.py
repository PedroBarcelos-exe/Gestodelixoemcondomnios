from datetime import date
from app.database import get_supabase_admin


def get_tarefas_do_dia(zelador_id: str, dia: date = None) -> list:
    db = get_supabase_admin()
    dia = dia or date.today()
    result = db.table("tarefas_zelador") \
        .select("*") \
        .eq("data", dia.isoformat()) \
        .order("prioridade") \
        .execute()
    return result.data or []


def criar_tarefa(zelador_id: str, data: dict) -> dict:
    db = get_supabase_admin()
    payload = {**data, "zelador_id": zelador_id, "data": data.get("data") or date.today().isoformat()}
    result = db.table("tarefas_zelador").insert(payload).execute()
    if not result.data:
        raise Exception("Erro ao criar tarefa")
    return result.data[0]


def atualizar_tarefa(tarefa_id: str, concluida: bool) -> dict:
    db = get_supabase_admin()
    payload = {"concluida": concluida}
    if concluida:
        from datetime import datetime
        payload["hora_conclusao"] = datetime.utcnow().isoformat()
    result = db.table("tarefas_zelador").update(payload).eq("id", tarefa_id).execute()
    if not result.data:
        raise Exception("Tarefa não encontrada")
    return result.data[0]


def get_todos_agendamentos(status_filter: str = None) -> list:
    db = get_supabase_admin()
    query = db.table("agendamentos_volumosos") \
        .select("*, profiles!agendamentos_volumosos_morador_id_fkey(nome, apartamento, bloco)")
    if status_filter:
        query = query.eq("status", status_filter)
    result = query.order("data_preferencial").execute()
    return result.data or []


def aprovar_agendamento(agendamento_id: str, zelador_id: str, data_agendada: str, obs: str = None) -> dict:
    db = get_supabase_admin()
    payload = {
        "status": "aprovado",
        "zelador_id": zelador_id,
        "data_agendada": data_agendada,
    }
    if obs:
        payload["observacao_zelador"] = obs
    result = db.table("agendamentos_volumosos").update(payload).eq("id", agendamento_id).execute()
    if not result.data:
        raise Exception("Agendamento não encontrado")
    return result.data[0]


def concluir_agendamento(agendamento_id: str, zelador_id: str) -> dict:
    db = get_supabase_admin()
    result = db.table("agendamentos_volumosos").update({
        "status": "concluido",
        "zelador_id": zelador_id,
    }).eq("id", agendamento_id).execute()
    if not result.data:
        raise Exception("Agendamento não encontrado")
    return result.data[0]


def get_stats_zelador() -> dict:
    db = get_supabase_admin()
    today = date.today()

    tarefas = db.table("tarefas_zelador").select("concluida").eq("data", today.isoformat()).execute()
    lista_tarefas = tarefas.data or []
    total = len(lista_tarefas)
    concluidas = sum(1 for t in lista_tarefas if t.get("concluida"))

    pendentes = db.table("agendamentos_volumosos").select("id").eq("status", "pendente").execute()
    qtd_pendentes = len(pendentes.data) if pendentes.data else 0

    return {
        "tarefas_total": total,
        "tarefas_concluidas": concluidas,
        "agendamentos_pendentes": qtd_pendentes,
        "alertas": 0,
    }
