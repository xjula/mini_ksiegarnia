from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db
from typing import List

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini Księgarnia API")

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

@app.get("/ksiazki/", response_model=list[schemas.KsiazkaResponse], tags=["Książki"])
def pobierz_ksiazki(db: Session = Depends(get_db)):
    # Pobieramy wszystkie książki
    return db.query(models.Ksiazka).all()


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
    db_ksiazka.seria = ksiazka.seria
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
        haslo=uzytkownik.haslo, # To jest wymagane przez models.py
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

# --- ZAMÓWIENIA ---

@app.post("/zamowienia/", response_model=schemas.ZamowienieResponse, tags=["Zamówienia"])
def stworz_zamowienie(zamowienie: schemas.ZamowienieCreate, db: Session = Depends(get_db)):
    # 1. Stworzenie nagłówka zamówienia
    nowe_zamowienie = models.Zamowienie(
        uzytkownik_id=zamowienie.uzytkownik_id,
        adres_id=zamowienie.adres_id,
        status="PENDING",
        cena_calkowita=0 # Wyliczymy na zajęciach VIII
    )
    db.add(nowe_zamowienie)
    db.commit()
    db.refresh(nowe_zamowienie)
    
    # 2. Dodanie pozycji (ksiazka_zamowienia)
    for pozycja in zamowienie.pozycje:
        ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == pozycja.ksiazka_id).first()
        if ksiazka:
            nowa_pozycja = models.KsiazkaZamowienie(
                zamowienia_id=nowe_zamowienie.id,
                ksiazka_id=pozycja.ksiazka_id,
                ilosc=pozycja.ilosc,
                cena=ksiazka.cena_jednostkowa
            )
            db.add(nowa_pozycja)
    
    db.commit()
    db.refresh(nowe_zamowienie)
    return nowe_zamowienie

@app.get("/zamowienia/", response_model=List[schemas.ZamowienieResponse], tags=["Zamówienia"])
def pobierz_zamowienia(db: Session = Depends(get_db)):
    return db.query(models.Zamowienie).all()

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