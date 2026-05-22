from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.zelador.models import TarefaUpdate, TarefaCreate, AgendamentoAprovar
from app.zelador import service

router = APIRouter(prefix="/zelador", tags=["Zelador"])


def _require_zelador(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ("zelador", "sindico"):
        raise HTTPException(status_code=403, detail="Acesso restrito ao zelador ou síndico")
    return current_user


@router.get("/stats")
async def stats(current_user: dict = Depends(_require_zelador)):
    """Estatísticas rápidas para o dashboard do zelador."""
    return service.get_stats_zelador()


@router.get("/tarefas")
async def listar_tarefas(
    data: str = None,
    current_user: dict = Depends(_require_zelador)
):
    """Lista tarefas do dia (ou da data informada)."""
    from datetime import date as dt
    dia = dt.fromisoformat(data) if data else dt.today()
    return service.get_tarefas_do_dia(current_user["id"], dia)


@router.post("/tarefas", status_code=status.HTTP_201_CREATED)
async def criar_tarefa(
    body: TarefaCreate,
    current_user: dict = Depends(_require_zelador)
):
    """Cria uma nova tarefa para o zelador."""
    try:
        return service.criar_tarefa(current_user["id"], body.model_dump(mode="json"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/tarefas/{tarefa_id}")
async def atualizar_tarefa(
    tarefa_id: str,
    body: TarefaUpdate,
    current_user: dict = Depends(_require_zelador)
):
    """Marca uma tarefa como concluída ou pendente."""
    try:
        return service.atualizar_tarefa(tarefa_id, body.concluida)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/agendamentos")
async def listar_agendamentos(
    status: str = None,
    current_user: dict = Depends(_require_zelador)
):
    """Lista todas as solicitações de coleta volumosa."""
    return service.get_todos_agendamentos(status)


@router.put("/agendamentos/{agendamento_id}/aprovar")
async def aprovar(
    agendamento_id: str,
    body: AgendamentoAprovar,
    current_user: dict = Depends(_require_zelador)
):
    """Aprova uma solicitação de coleta volumosa."""
    try:
        return service.aprovar_agendamento(
            agendamento_id,
            current_user["id"],
            body.data_agendada.isoformat(),
            body.observacao_zelador
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/agendamentos/{agendamento_id}/concluir")
async def concluir(
    agendamento_id: str,
    current_user: dict = Depends(_require_zelador)
):
    """Marca uma coleta volumosa como concluída."""
    try:
        return service.concluir_agendamento(agendamento_id, current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
