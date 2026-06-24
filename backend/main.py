from fastapi import FastAPI, Depends, HTTPException
import stripe
from stripe import CardError
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from models import Ksiazka, Kategoria
from pydantic import BaseModel
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from sqlalchemy import func

import httpx
from fastapi.responses import RedirectResponse
from jose import jwt
from datetime import datetime, timedelta, timezone
from services.trend_service import aktualizuj_trend_w_bazie
from services import address_service
from services import book_service
from services import order_service
from services import payment_service
from services import review_service

load_dotenv()
models.Base.metadata.create_all(bind=engine)

stripe.api_key = os.getenv("STRIPE_API_KEY")

app = FastAPI(title="Mini Księgarnia API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    id_ksiazki: int
    ilosc: int

class Order(BaseModel):
    uzytkownik_id: int
    produkty: List[Item]
    koszt_dostawy: float = 0.0 

# --- KATEGORIE ---
@app.post("/kategorie/", response_model=schemas.KategoriaResponse, tags=["Kategorie"])
def dodaj_kategorie(kategoria: schemas.KategoriaCreate, db: Session = Depends(get_db)):
    nowa_kategoria = models.Kategoria(nazwa=kategoria.nazwa)
    db.add(nowa_kategoria)
    db.commit()
    db.refresh(nowa_kategoria)
    return nowa_kategoria

@app.get("/kategorie/", response_model=List[schemas.KategoriaResponse], tags=["Kategorie"])
def pobierz_kategorie(db: Session = Depends(get_db)):
    return db.query(models.Kategoria).all()

# --- KSIĄŻKI ---
@app.post("/ksiazki/", response_model=schemas.KsiazkaResponse, tags=["Książki"])
def dodaj_ksiazke(ksiazka: schemas.KsiazkaCreate, db: Session = Depends(get_db)):
    return book_service.dodaj_ksiazke(ksiazka, db)

@app.get("/ksiazki/", tags=["Książki"])
def get_books(db: Session = Depends(get_db)):
    return book_service.pobierz_ksiazki(db)

@app.put("/ksiazki/", response_model=schemas.KsiazkaResponse, tags=["Książki"])
def edytuj_ksiazke(
    book_id: int,
    book_update: schemas.KsiazkaCreate,
    db: Session = Depends(get_db)
):
    return book_service.edytuj_ksiazke(book_id, book_update, db)

@app.delete("/ksiazki/{ksiazka_id}", response_model=schemas.KsiazkaResponse, tags=["Książki"])
def usun_ksiazke(ksiazka_id: int, db: Session = Depends(get_db)):
    return book_service.usun_ksiazke(ksiazka_id, db)

# --- UŻYTKOWNICY ---

@app.post("/uzytkownicy/", response_model=schemas.UzytkownikResponse, tags=["Użytkownicy"])
def stworz_uzytkownika(uzytkownik: schemas.UzytkownikCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == uzytkownik.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email już zajęty")
    
    nowy_uzytkownik = models.Uzytkownik(
        email=uzytkownik.email, 
        full_name=uzytkownik.full_name,
        haslo=uzytkownik.haslo, 
        rola=uzytkownik.rola,
        oauth=uzytkownik.oauth
    )
    db.add(nowy_uzytkownik)
    db.commit()
    db.refresh(nowy_uzytkownik)
    return nowy_uzytkownik

@app.get("/uzytkownicy/", response_model=List[schemas.UzytkownikResponse], tags=["Użytkownicy"])
def pobierz_uzytkownikow(db: Session = Depends(get_db)):
    return db.query(models.Uzytkownik).all()

@app.get("/uzytkownicy/{uzytkownik_id}/zamowienia", tags=["Zamówienia"])
def pobierz_zamowienia_uzytkownika(
    uzytkownik_id: int,
    db: Session = Depends(get_db)
):
    return order_service.pobierz_zamowienia_uzytkownika(
        uzytkownik_id,
        db
    )

@app.get("/zamowienia/", response_model=List[schemas.ZamowienieResponse], tags=["Zamówienia"])
def pobierz_zamowienia(db: Session = Depends(get_db)):
    return order_service.pobierz_zamowienia(db)

@app.post("/zamowienia/{zamowienie_id}/offline", tags=["Płatności"])
def ustaw_platnosc_offline(zamowienie_id: int, db: Session = Depends(get_db)):
    return payment_service.ustaw_platnosc_offline(zamowienie_id, db)

@app.put("/zamowienia/{zamowienie_id}/zatwierdz-offline", tags=["Admin"])
def zatwierdz_platnosc_offline(zamowienie_id: int, db: Session = Depends(get_db)):
    return payment_service.zatwierdz_platnosc_offline(zamowienie_id, db)

@app.put("/zamowienia/{zamowienie_id}/status", tags=["Zamówienia"])
def zmien_status_zamowienia(
    zamowienie_id: int,
    dane: schemas.ZamowienieStatusUpdate,
    db: Session = Depends(get_db)
):
    return order_service.zmien_status_zamowienia(zamowienie_id, dane, db)

# --- RECENZJE ---

@app.post("/recenzje/", tags=["Recenzje"])
def dodaj_recenzje(
    recenzja: schemas.RecenzjaCreate,
    db: Session = Depends(get_db)
):
    return review_service.dodaj_recenzje(recenzja, db)

@app.get("/recenzje/", tags=["Recenzje"])
def pobierz_recenzje(db: Session = Depends(get_db)):
    return review_service.pobierz_recenzje(db)

@app.delete("/recenzje/{recenzja_id}", tags=["Recenzje"])
def usun_recenzje(
    recenzja_id: int,
    db: Session = Depends(get_db)
):
    return review_service.usun_recenzje(recenzja_id, db)

# --- ADRESY ---
@app.post("/adresy/", response_model=schemas.AdresResponse, tags=["Adresy"])
def dodaj_adres(adres: schemas.AdresCreate, db: Session = Depends(get_db)):
    return address_service.dodaj_adres(adres, db)

@app.get("/adresy/", response_model=List[schemas.AdresResponse], tags=["Adresy"])
def pobierz_adresy(db: Session = Depends(get_db)):
    return address_service.pobierz_adresy(db)

@app.get("/zamowienia/{zamowienie_id}", response_model=schemas.ZamowienieResponse, tags=["Zamówienia"])
def pobierz_zamowienie(zamowienie_id: int, db: Session = Depends(get_db)):
    return order_service.pobierz_zamowienie(zamowienie_id, db)

@app.post("/zamowienia/", tags=["Zamówienia"])
async def stworz_zamowienie(zamowienie: Order, db: Session = Depends(get_db)):
    return order_service.stworz_zamowienie(zamowienie, db)

# --- PŁATNOŚCI STRIPE ---

# Klasa pomocnicza dla Swaggera
class KartaKredytowa(BaseModel):
    metoda_platnosci: str = "pm_card_visa" 

@app.post("/zamowienia/{zamowienie_id}/zaplac", tags=["Płatności"])
def zaplac_za_zamowienie(
    zamowienie_id: int,
    karta: KartaKredytowa,
    db: Session = Depends(get_db)
):
    return payment_service.zaplac_za_zamowienie(zamowienie_id, karta, db)

#Logowanie

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET or not JWT_SECRET_KEY:
    print("UWAGA: Brak skonfigurowanych kluczy w pliku .env")

@app.get("/auth/login", tags=["Autoryzacja"])
async def github_login():
    github_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email"
    return RedirectResponse(url=github_url)

@app.get("/auth/callback", tags=["Autoryzacja"])
async def github_callback(code: str, db: Session = Depends(get_db)): 
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code
            },
            headers={"Accept": "application/json"}
        )
        
    token_data = token_response.json()
    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail="Błąd autoryzacji w GitHub")
        
    access_token = token_data["access_token"]
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"}
        )
    user_info = user_response.json()
    github_login_name = user_info.get("login")
    
    is_admin = github_login_name == "megu02" 
    
    user_email = user_info.get("email")
    if not user_email:
        try:
            async with httpx.AsyncClient() as client:
                emails_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"token {access_token}"}
                )
            emails_list = emails_response.json()
            primary_email = next((e["email"] for e in emails_list if e.get("primary")), None)
            if primary_email:
                user_email = primary_email
        except Exception as email_err:
            print(f"Nie udało się pobrać prywatnych maili: {email_err}")

    if not user_email:
        user_email = f"{github_login_name}@github.com"
    
    db_user = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == user_email).first()
    
    if not db_user:
        db_user = models.Uzytkownik(
            email=user_email,
            full_name=user_info.get("name") or github_login_name,
            haslo="oauth_github_authenticated_session",
            oauth=True,
            rola="admin" if is_admin else "user"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    expire = datetime.now(timezone.utc) + timedelta(hours=2)
    token_payload = {
        "id": db_user.id,
        "sub": github_login_name,
        "email": user_email,
        "avatar": user_info.get("avatar_url"),
        "isAdmin": is_admin,
        "exp": expire
    }
    
    jwt_token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return RedirectResponse(url=f"http://localhost:5173/login-success?token={jwt_token}")

@app.post("/login")
def login(dane: schemas.LoginRequest, db: Session = Depends(get_db)):
    uzytkownik = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.email == dane.email
    ).first()

    if not uzytkownik:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    if uzytkownik.haslo != dane.haslo:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    return {
        "id": uzytkownik.id,
        "email": uzytkownik.email,
        "full_name": uzytkownik.full_name,
        "rola": uzytkownik.rola
    }

@app.get("/uzytkownicy/{uzytkownik_id}/adresy", tags=["Adresy"])
def pobierz_adresy_uzytkownika(
    uzytkownik_id: int,
    db: Session = Depends(get_db)
):
    return address_service.pobierz_adresy_uzytkownika(uzytkownik_id, db)