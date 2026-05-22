from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from datetime import date
from app.auth.dependencies import get_current_user
from app.sindico import service

router = APIRouter(prefix="/sindico", tags=["Síndico"])


def _require_sindico(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "sindico":
        raise HTTPException(status_code=403, detail="Acesso restrito ao síndico")
    return current_user


@router.get("/relatorios")
async def listar_relatorios(_: dict = Depends(_require_sindico)):
    """Lista relatórios disponíveis (últimos 12 meses)."""
    hoje = date.today()
    relatorios = []
    for i in range(12):
        m = (hoje.month - i - 1) % 12 + 1
        a = hoje.year if (hoje.month - i) > 0 else hoje.year - 1
        relatorios.append({"mes": m, "ano": a})
    return relatorios


@router.get("/relatorios/{ano}/{mes}")
async def get_relatorio(
    ano: int,
    mes: int,
    _: dict = Depends(_require_sindico)
):
    """Retorna dados consolidados do relatório mensal."""
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="Mês inválido")
    return service.get_relatorio_mensal(mes, ano)


@router.get("/analytics")
async def analytics(_: dict = Depends(_require_sindico)):
    """Retorna análises detalhadas (últimos 5 meses, moradores, participação)."""
    return service.get_analytics_completo()


@router.get("/analytics/chatbot")
async def analytics_chatbot(_: dict = Depends(_require_sindico)):
    """Retorna insights do chatbot IA: perguntas frequentes e sugestões."""
    return service.get_analytics_chatbot()


@router.get("/export/pdf/{ano}/{mes}")
async def exportar_pdf(
    ano: int,
    mes: int,
    _: dict = Depends(_require_sindico)
):
    """Gera e retorna o relatório mensal em PDF."""
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="Mês inválido")
    try:
        pdf_bytes = service.exportar_pdf(mes, ano)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=relatorio_{ano}_{mes:02d}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")
