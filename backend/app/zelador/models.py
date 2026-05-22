from pydantic import BaseModel
from datetime import date
from typing import Optional
from uuid import UUID


class TarefaUpdate(BaseModel):
    concluida: bool


class TarefaCreate(BaseModel):
    descricao: str
    prioridade: str = "media"
    categoria: str = "outro"
    data: Optional[date] = None


class AgendamentoAprovar(BaseModel):
    data_agendada: date
    observacao_zelador: Optional[str] = None
