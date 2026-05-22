from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.coletas.models import ColetaCreate, ColetaResponse
from app.database import get_supabase_admin
from datetime import date

router = APIRouter(prefix="/coletas", tags=["Coletas"])


def _require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ("zelador", "sindico"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissao negada")
    return current_user


@router.get("", response_model=list[ColetaResponse])
async def listar_coletas(
    inicio: Optional[str] = None,
    fim: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lista o calendario de coletas."""
    db = get_supabase_admin()
    query = db.table("coletas").select("*").eq("ativo", True)
    
    if inicio:
        query = query.gte("data", inicio)
    if fim:
        query = query.lte("data", fim)
        
    result = query.order("data").execute()
    return result.data or []


@router.post("", response_model=ColetaResponse, status_code=status.HTTP_201_CREATED)
async def criar_coleta(
    body: ColetaCreate,
    _: dict = Depends(_require_admin)
):
    """Cria uma nova coleta recorrente ou unica."""
    db = get_supabase_admin()
    
    # Se dia_semana nao foi enviado mas a recorrencia e semanal, extrair da data
    data_dict = body.model_dump(mode="json")
    if body.recorrencia == "semanal" and body.dia_semana is None:
        data_dict["dia_semana"] = body.data.weekday()
        
    result = db.table("coletas").insert(data_dict).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Erro ao criar coleta")
    return result.data[0]


@router.put("/{coleta_id}", response_model=ColetaResponse)
async def editar_coleta(
    coleta_id: str,
    body: ColetaCreate,
    _: dict = Depends(_require_admin)
):
    """Edita uma coleta existente."""
    db = get_supabase_admin()
    data_dict = body.model_dump(mode="json")
    result = db.table("coletas").update(data_dict).eq("id", coleta_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada")
    return result.data[0]


@router.delete("/{coleta_id}")
async def deletar_coleta(
    coleta_id: str,
    _: dict = Depends(_require_admin)
):
    """Desativa ou deleta uma coleta."""
    db = get_supabase_admin()
    result = db.table("coletas").update({"ativo": False}).eq("id", coleta_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada")
    return {"message": "Coleta removida com sucesso"}
