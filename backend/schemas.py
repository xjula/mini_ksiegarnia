from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- KATEGORIE ---
class KategoriaCreate(BaseModel):
    nazwa: str

class KategoriaResponse(KategoriaCreate):
    id: int
    class Config:
        from_attributes = True

# --- KSIĄŻKI ---
class KsiazkaCreate(BaseModel):
    tytul: str
    autor: str
    opis: str
    seria: Optional[str] = None
    wydawnictwo: str
    jezyk_wydania: str
    numer_wydania: int
    data_premiery: datetime
    okladka: str
    cena_jednostkowa: float
    ilosc_sztuk: int
    kategoria_id: int

class KsiazkaResponse(KsiazkaCreate):
    id: int
    class Config:
        from_attributes = True

# --- UŻYTKOWNICY ---
class UzytkownikBase(BaseModel):
    email: EmailStr
    full_name: str
    oauth: bool = False
    rola: str = "user"

class UzytkownikCreate(UzytkownikBase):
    haslo: str 

class UzytkownikResponse(UzytkownikBase):
    id: int
    data_dodania: datetime
    class Config:
        from_attributes = True

# --- ADRESY ---
class AdresCreate(BaseModel):
    uzytkownik_id: int
    ulica_i_numer: str
    kod_pocztowy: str
    miasto: str
    kraj: str

class AdresResponse(AdresCreate):
    id: int
    class Config:
        from_attributes = True

# --- POZYCJE ZAMÓWIENIA ---
class PozycjaZamowieniaCreate(BaseModel):
    ksiazka_id: int
    ilosc: int

class PozycjaZamowieniaResponse(BaseModel):
    ksiazka_id: int
    ilosc: int
    cena: float
    class Config:
        from_attributes = True

# --- ZAMÓWIENIA ---
class ZamowienieCreate(BaseModel):
    uzytkownik_id: int
    adres_id: int
    pozycje: List[PozycjaZamowieniaCreate]

class ZamowienieResponse(BaseModel):
    id: int
    status: str
    cena_calkowita: float
    data_zamowienia: datetime
    uzytkownik_id: int
    adres_id: int
    metoda_dostawy: Optional[str] = None
    koszt_dostawy: Optional[float] = None
    ksiazki_link: List[PozycjaZamowieniaResponse] 
    class Config:
        from_attributes = True

# --- RECENZJE ---
class RecenzjaCreate(BaseModel):
    ocena: int
    komentarz: str
    uzytkownik_id: int
    ksiazka_id: int

class RecenzjaResponse(RecenzjaCreate):
    id: int
    data_dodania: datetime
    class Config:
        from_attributes = True

# --- PŁATNOŚCI ---
class PlatnoscCreate(BaseModel):
    metoda: str 
    zamowienie_id: int

class PlatnoscResponse(BaseModel):
    id: int
    metoda: str
    status: str
    external_id: Optional[str] = None
    zamowienie_id: int
    class Config:
        from_attributes = True

