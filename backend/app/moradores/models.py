from pydantic import BaseModel
from datetime import date
from typing import Optional
from uuid import UUID


class AgendamentoCreate(BaseModel):
    tipo_item: str
    descricao: str
    data_preferencial: date


class AgendamentoResponse(BaseModel):
    id: UUID
    tipo_item: str
    descricao: str
    data_preferencial: date
    data_agendada: Optional[date]
    status: str
    observacao_zelador: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class RegistroDescarteCreate(BaseModel):
    tipo: str
    correto: bool = True
    peso_kg: Optional[float] = None
    observacao: Optional[str] = None


class DashboardMoradorResponse(BaseModel):
    nome: str
    apartamento: Optional[str]
    meta_mensal_pct: float
    descartes_corretos: int
    total_descartes: int
    agendamentos_pendentes: int
    proxima_coleta: Optional[dict]
