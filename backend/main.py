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
import pika
import json
import os
from dotenv import load_dotenv
from sqlalchemy import func

import httpx
from fastapi.responses import RedirectResponse
from jose import jwt
from datetime import datetime, timedelta, timezone

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
    kategoria_istnieje = db.query(models.Kategoria).filter(models.Kategoria.id == ksiazka.kategoria_id).first()
    if not kategoria_istnieje:
        raise HTTPException(status_code=404, detail="Podana kategoria nie istnieje!")

    # Dodajemy książkę
    nowa_ksiazka = models.Ksiazka(**ksiazka.model_dump())
    db.add(nowa_ksiazka)
    db.commit()
    db.refresh(nowa_ksiazka)
    return nowa_ksiazka

@app.get("/ksiazki/")
def get_books(db: Session = Depends(get_db)):
    # Pobieramy tylko kolumny, które na pewno istnieją w bazie
    results = db.query(
        Ksiazka.id,
        Ksiazka.tytul,
        Ksiazka.autor,
        Ksiazka.opis,
        Ksiazka.wydawnictwo,
        Ksiazka.jezyk_wydania,
        Ksiazka.numer_wydania,
        Ksiazka.data_premiery,
        Ksiazka.okladka,
        Ksiazka.cena_jednostkowa,
        Ksiazka.ilosc_sztuk,
        Ksiazka.kategoria_id,
        Ksiazka.trend,
        Kategoria.nazwa.label("kategoria_nazwa")
    ).join(Kategoria).all()

    # Zamieniamy to na format zrozumiały dla frontendu
    books_list = []
    for book in results:
        srednia_ocena = db.query(
            func.avg(models.Recenzja.ocena)
        ).filter(
            models.Recenzja.ksiazka_id == book.id
        ).scalar()

        liczba_recenzji = db.query(
            models.Recenzja
        ).filter(
            models.Recenzja.ksiazka_id == book.id
        ).count()
        books_list.append({
            "id": book.id,
            "title": book.tytul,
            "author": book.autor,
            "description": book.opis,
            "publisher": book.wydawnictwo,
            "language": book.jezyk_wydania,
            "edition": book.numer_wydania,
            "publishDate": str(book.data_premiery),
            "cover": book.okladka,
            "price": float(book.cena_jednostkowa),
            "stock": book.ilosc_sztuk,
            "category": book.kategoria_nazwa,
            "trend": book.trend,

            "rating": round(float(srednia_ocena or 0), 1),
            "reviewCount": liczba_recenzji
        })
    return books_list


@app.put("/ksiazki/{ksiazka_id}", response_model=schemas.KsiazkaResponse, tags=["Książki"])
def edytuj_ksiazke(ksiazka_id: int, ksiazka: schemas.KsiazkaCreate, db: Session = Depends(get_db)):
    # 1. Szukamy książki w bazie po ID
    db_ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == ksiazka_id).first()
    
    if not db_ksiazka:
        raise HTTPException(status_code=404, detail="Podana książka nie istnieje!")

    # 2. Jeśli istnieje, podmieniamy jej dane
    db_ksiazka.tytul = ksiazka.tytul
    db_ksiazka.autor = ksiazka.autor
    db_ksiazka.opis = ksiazka.opis
    db_ksiazka.wydawnictwo = ksiazka.wydawnictwo
    db_ksiazka.okladka = ksiazka.okladka
    db_ksiazka.cena_jednostkowa = ksiazka.cena_jednostkowa
    db_ksiazka.ilosc_sztuk = ksiazka.ilosc_sztuk
    db_ksiazka.kategoria_id = ksiazka.kategoria_id

    # 3. Zapisujemy zmiany
    db.commit()
    db.refresh(db_ksiazka)
    return db_ksiazka


@app.delete("/ksiazki/{ksiazka_id}", response_model=schemas.KsiazkaResponse, tags=["Książki"])
def usun_ksiazke(ksiazka_id: int, db: Session = Depends(get_db)):
    # 1. Szukamy książki
    db_ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == ksiazka_id).first()
    
    if not db_ksiazka:
        raise HTTPException(status_code=404, detail="Podana książka nie istnieje!")

    # 2. Usuwamy ją z bazy
    db.delete(db_ksiazka)
    db.commit()
    return {"wiadomosc": f"Książka o ID {ksiazka_id} została pomyślnie usunięta."}

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


@app.get("/zamowienia/", response_model=List[schemas.ZamowienieResponse], tags=["Zamówienia"])
def pobierz_zamowienia(db: Session = Depends(get_db)):
    return db.query(models.Zamowienie).all()

@app.post("/zamowienia/{zamowienie_id}/offline", tags=["Płatności"])
def ustaw_platnosc_offline(zamowienie_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(
        models.Zamowienie.id == zamowienie_id
    ).first()

    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    zamowienie.status = "OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE"

    platnosc = models.Platnosc(
        zamowienia_id=zamowienie.id,
        status="PENDING_OFFLINE",
        metoda_platnosci="OFFLINE",
        platnosc_id=None
    )

    db.add(platnosc)
    db.commit()

    return {"status": zamowienie.status}

@app.put("/zamowienia/{zamowienie_id}/zatwierdz-offline", tags=["Admin"])
def zatwierdz_platnosc_offline(zamowienie_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(
        models.Zamowienie.id == zamowienie_id
    ).first()

    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    if zamowienie.status not in ["OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE"]:
        raise HTTPException(
            status_code=400,
            detail="To zamówienie nie oczekuje na płatność offline"
        )

    zamowienie.status = "OPŁACONE"

    platnosc = db.query(models.Platnosc).filter(
        models.Platnosc.zamowienia_id == zamowienie.id
    ).first()

    if platnosc:
        platnosc.status = "SUCCESS_OFFLINE"
    else:
        platnosc = models.Platnosc(
            zamowienia_id=zamowienie.id,
            status="SUCCESS_OFFLINE",
            metoda_platnosci="OFFLINE",
            platnosc_id=None
        )
        db.add(platnosc)

    db.commit()

    return {"status": zamowienie.status}

@app.put("/zamowienia/{zamowienie_id}/status", tags=["Zamówienia"])
def zmien_status_zamowienia(
    zamowienie_id: int,
    dane: schemas.ZamowienieStatusUpdate,
    db: Session = Depends(get_db)
):
    zamowienie = db.query(models.Zamowienie).filter(
        models.Zamowienie.id == zamowienie_id
    ).first()

    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    zamowienie.status = dane.status
    db.commit()
    db.refresh(zamowienie)

    return {
        "id": zamowienie.id,
        "status": zamowienie.status,
        "wiadomosc": "Status zamówienia został zmieniony"
    }

# --- RECENZJE ---

@app.post("/recenzje/", response_model=schemas.RecenzjaResponse, tags=["Recenzje"])
def dodaj_recenzje(recenzja: schemas.RecenzjaCreate, db: Session = Depends(get_db)):
    nowa_recenzja = models.Recenzja(**recenzja.dict())
    db.add(nowa_recenzja)
    db.commit()
    db.refresh(nowa_recenzja)
    return nowa_recenzja

@app.get("/recenzje/", response_model=List[schemas.RecenzjaResponse], tags=["Recenzje"])
def pobierz_recenzje(db: Session = Depends(get_db)):
    return db.query(models.Recenzja).all()

# --- ADRESY ---

@app.post("/adresy/", response_model=schemas.AdresResponse, tags=["Adresy"])
def dodaj_adres(adres: schemas.AdresCreate, db: Session = Depends(get_db)):
    nowy_adres = models.Adres(**adres.dict())
    db.add(nowy_adres)
    db.commit()
    db.refresh(nowy_adres)
    return nowy_adres

@app.get("/adresy/", response_model=List[schemas.AdresResponse], tags=["Adresy"])
def pobierz_adresy(db: Session = Depends(get_db)):
    return db.query(models.Adres).all()

@app.get("/zamowienia/{zamowienie_id}", response_model=schemas.ZamowienieResponse, tags=["Zamówienia"])
def pobierz_zamowienie(zamowienie_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id == zamowienie_id).first()
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
    return zamowienie
@app.post("/zamowienia/", tags=["Zamówienia"])
async def stworz_zamowienie(zamowienie: Order, db: Session = Depends(get_db)):
    laczna_cena = 0.0 
    kupione_ksiazki_ids = []

    nowe_zamowienie = models.Zamowienie(
        status="PENDING", 
        cena_calkowita=0.0, 
        koszt_dostawy=zamowienie.koszt_dostawy
    ) 
    db.add(nowe_zamowienie)
    db.commit() 
    db.refresh(nowe_zamowienie) 

    for item in zamowienie.produkty:
        db_book = db.query(Ksiazka).filter(Ksiazka.id == item.id_ksiazki).first()
        if db_book:
            laczna_cena += (db_book.cena_jednostkowa * item.ilosc)
            db_book.ilosc_sztuk -= item.ilosc
            kupione_ksiazki_ids.append(item.id_ksiazki)
            

            nowa_pozycja = models.KsiazkaZamowienie(
                zamowienia_id=nowe_zamowienie.id,
                ksiazka_id=db_book.id,
                ilosc=item.ilosc,
                cena=db_book.cena_jednostkowa
            )
            db.add(nowa_pozycja)
    
    nowe_zamowienie.cena_calkowita = laczna_cena + zamowienie.koszt_dostawy
    db.commit() 

    # --- WYSYŁKA ZADAŃ DO RABBITMQ ---
    try:
        url = os.getenv("RABBITMQ_URL")
        params = pika.URLParameters(url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue='trendy_kolejka')

        for book_id in kupione_ksiazki_ids:
            wiadomosc = {"book_id": book_id, "akcja": "przelicz_trend"}
            channel.basic_publish(exchange='', routing_key='trendy_kolejka', body=json.dumps(wiadomosc))
        
        connection.close()
    except Exception as rabbit_err:
        print(f"Błąd RabbitMQ: {rabbit_err}")
    
    return {"status": "success", "zamowienie_id": nowe_zamowienie.id}
    

# --- PŁATNOŚCI STRIPE ---

# Klasa pomocnicza dla Swaggera
class KartaKredytowa(BaseModel):
    metoda_platnosci: str = "pm_card_visa" 

@app.post("/zamowienia/{zamowienie_id}/zaplac", tags=["Płatności"])
def zaplac_za_zamowienie(zamowienie_id: int, karta: KartaKredytowa, db: Session = Depends(get_db)):
    # 1. Szukamy zamówienia w bazie
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id == zamowienie_id).first()
    
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
        
    if zamowienie.status == "OPŁACONE":
        raise HTTPException(status_code=400, detail="To zamówienie zostało już opłacone.")

    # 2. Pobieramy prawdziwą cenę z zamówienia w bazie i zamieniamy na grosze dla Stripe
    kwota_w_groszach = int(round(zamowienie.cena_calkowita * 100))

    # 3. Próba obciążenia karty 
    try:
        intent = stripe.PaymentIntent.create(
            amount=kwota_w_groszach,
            currency="pln",
            payment_method=karta.metoda_platnosci,
            payment_method_types=["card"],
            confirm=True 
        )
        
       # --- SCENARIUSZ POZYTYWNY ---
        zamowienie.status = "OPŁACONE"
        
        # Zapisujemy dowód płatności w bazie
        nowa_platnosc = models.Platnosc(
            zamowienia_id=zamowienie.id,
            status="SUCCESS",
            metoda_platnosci="ONLINE_STRIPE",
            platnosc_id=intent.id
        )
        db.add(nowa_platnosc)
        db.commit()

        try:
            url = os.getenv("RABBITMQ_URL")
            params = pika.URLParameters(url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.queue_declare(queue='platnosci')

            wiadomosc = {
                "zamowienie_id": zamowienie_id,
                "status": "OPŁACONE",
                "kwota": kwota_w_groszach / 100 
            }

            channel.basic_publish(
                exchange='',
                routing_key='platnosci',
                body=json.dumps(wiadomosc)
            )
            print(f"Sukces: Wysłano do RabbitMQ dla zamówienia {zamowienie_id}")
            connection.close()
        except Exception as rabbit_err:
            print(f"Błąd RabbitMQ: {rabbit_err}")
        # -------------------------------------
        
        return {"wiadomosc": "Płatność zakończona sukcesem!", "status": zamowienie.status}
    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=f"Błąd karty: {str(e)}")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Błąd Stripe: {str(e)}")
    

#Logowanie

# 1. KONFIGURACJA GITHUB
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET or not JWT_SECRET_KEY:
    print("UWAGA: Brak skonfigurowanych kluczy w pliku .env")

# 2. Endpoint inicjujący - przekierowuje użytkownika do okna logowania GitHub
@app.get("/auth/login", tags=["Autoryzacja"])
async def github_login():
    github_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email"
    return RedirectResponse(url=github_url)

# 3. Callback - tu wraca użytkownik z GitHuba z tymczasowym kodem
@app.get("/auth/callback", tags=["Autoryzacja"])
async def github_callback(code: str):
    # A. Wymieniamy kod na Access Token od GitHuba
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
    
    # B. Pobieramy dane profilu użytkownika
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
    
    # C. Pakujemy dane w nasz bezpieczny token JWT
    expire = datetime.utcnow() + timedelta(hours=2)
    token_payload = {
        "sub": user_info.get("login"),
        "email": user_email,
        "avatar": user_info.get("avatar_url"),
        "isAdmin": is_admin,
        "exp": expire
    }
    
    jwt_token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm=ALGORITHM)
    
    # D. Odsyłamy użytkownika na specjalną podstronę w React i podajemy token w adresie URL
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
    return db.query(models.Adres).filter(
        models.Adres.uzytkownik_id == uzytkownik_id
    ).all()