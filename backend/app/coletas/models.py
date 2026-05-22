from pydantic import BaseModel
from datetime import date, time
from typing import Optional
from uuid import UUID


class ColetaCreate(BaseModel):
    tipo: str
    data: date
    horario: time = time(7, 0)
    descricao: Optional[str] = None
    recorrencia: str = "semanal"
    dia_semana: Optional[int] = None


class ColetaResponse(BaseModel):
    id: UUID
    tipo: str
    data: date
    horario: time
    descricao: Optional[str]
    recorrencia: str
    dia_semana: Optional[int]
    ativo: bool

    class Config:
        from_attributes = True
