from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.moradores.models import AgendamentoCreate, RegistroDescarteCreate
from app.moradores import service

router = APIRouter(prefix="/moradores", tags=["Moradores"])


def _require_morador(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ("morador", "sindico", "zelador"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    return current_user


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(_require_morador)):
    """Estatísticas do dashboard do morador."""
    stats = service.get_dashboard_stats(current_user["id"])
    return {
        "nome": current_user["nome"],
        "apartamento": current_user.get("apartamento"),
        **stats,
    }


@router.get("/proximas-coletas")
async def proximas_coletas(limit: int = 7, current_user: dict = Depends(get_current_user)):
    """Lista as próximas coletas agendadas."""
    return service.get_proximas_coletas(limit)


@router.get("/agendamentos")
async def listar_agendamentos(current_user: dict = Depends(_require_morador)):
    """Lista todos os agendamentos de volumosos do morador."""
    return service.get_agendamentos(current_user["id"])


@router.post("/agendamentos", status_code=status.HTTP_201_CREATED)
async def criar_agendamento(
    body: AgendamentoCreate,
    current_user: dict = Depends(_require_morador)
):
    """Cria uma nova solicitação de coleta de volumosos."""
    try:
        resultado = service.create_agendamento(
            current_user["id"],
            body.model_dump(mode="json")
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/agendamentos/{agendamento_id}")
async def cancelar_agendamento(
    agendamento_id: str,
    current_user: dict = Depends(_require_morador)
):
    """Cancela um agendamento pendente."""
    from app.database import get_supabase_admin
    db = get_supabase_admin()
    # Verificar propriedade
    ag = db.table("agendamentos_volumosos").select("*").eq("id", agendamento_id).single().execute()
    if not ag.data:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if ag.data["morador_id"] != current_user["id"] and current_user["role"] not in ("zelador", "sindico"):
        raise HTTPException(status_code=403, detail="Sem permissão")
    if ag.data["status"] != "pendente":
        raise HTTPException(status_code=400, detail="Só é possível cancelar agendamentos pendentes")

    db.table("agendamentos_volumosos").update({"status": "cancelado"}).eq("id", agendamento_id).execute()
    return {"message": "Agendamento cancelado com sucesso"}


@router.get("/impacto")
async def impacto(current_user: dict = Depends(_require_morador)):
    """Estatísticas de impacto ambiental do morador."""
    return service.get_impacto_stats(current_user["id"])


@router.post("/descarte", status_code=status.HTTP_201_CREATED)
async def registrar_descarte(
    body: RegistroDescarteCreate,
    current_user: dict = Depends(_require_morador)
):
    """Registra um descarte de resíduo."""
    try:
        return service.registrar_descarte(current_user["id"], body.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
