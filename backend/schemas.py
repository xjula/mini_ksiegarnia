from pydantic import BaseModel
from typing import Optional

class KategoriaCreate(BaseModel):
    nazwa: str

class KategoriaResponse(KategoriaCreate):
    id: int

    class Config:
        from_attributes = True

class KsiazkaCreate(BaseModel):
    tytul: str
    autor: str
    opis: Optional[str] = None
    cena_jednostkowa: float
    ilosc_sztuk: int
    kategoria_id: int

class KsiazkaResponse(KsiazkaCreate):
    id: int

    class Config:
        from_attributes = True