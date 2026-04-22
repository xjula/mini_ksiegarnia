from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini Księgarnia API")


@app.post("/kategorie/", response_model=schemas.KategoriaResponse)
def dodaj_kategorie(kategoria: schemas.KategoriaCreate, db: Session = Depends(get_db)):
    # Tworzymy nowy obiekt kategorii w bazie
    nowa_kategoria = models.Kategoria(nazwa=kategoria.nazwa)
    db.add(nowa_kategoria)
    db.commit() # Zapisujemy zmiany
    db.refresh(nowa_kategoria) # Odświeżamy, żeby uzyskać nadane ID
    return nowa_kategoria

@app.get("/kategorie/", response_model=list[schemas.KategoriaResponse])
def pobierz_kategorie(db: Session = Depends(get_db)):
    # Pobieramy wszystkie kategorie z bazy
    return db.query(models.Kategoria).all()


@app.post("/ksiazki/", response_model=schemas.KsiazkaResponse)
def dodaj_ksiazke(ksiazka: schemas.KsiazkaCreate, db: Session = Depends(get_db)):
    # Sprawdzamy, czy kategoria o podanym ID w ogóle istnieje
    kategoria_istnieje = db.query(models.Kategoria).filter(models.Kategoria.id == ksiazka.kategoria_id).first()
    if not kategoria_istnieje:
        raise HTTPException(status_code=404, detail="Podana kategoria nie istnieje!")

    # Dodajemy książkę
    nowa_ksiazka = models.Ksiazka(**ksiazka.model_dump())
    db.add(nowa_ksiazka)
    db.commit()
    db.refresh(nowa_ksiazka)
    return nowa_ksiazka

@app.get("/ksiazki/", response_model=list[schemas.KsiazkaResponse])
def pobierz_ksiazki(db: Session = Depends(get_db)):
    # Pobieramy wszystkie książki
    return db.query(models.Ksiazka).all()


@app.put("/ksiazki/{ksiazka_id}", response_model=schemas.KsiazkaResponse)
def edytuj_ksiazke(ksiazka_id: int, ksiazka: schemas.KsiazkaCreate, db: Session = Depends(get_db)):
    # 1. Szukamy książki w bazie po ID
    db_ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == ksiazka_id).first()
    
    if not db_ksiazka:
        raise HTTPException(status_code=404, detail="Podana książka nie istnieje!")

    # 2. Jeśli istnieje, podmieniamy jej dane
    db_ksiazka.tytul = ksiazka.tytul
    db_ksiazka.autor = ksiazka.autor
    db_ksiazka.opis = ksiazka.opis
    db_ksiazka.cena_jednostkowa = ksiazka.cena_jednostkowa
    db_ksiazka.ilosc_sztuk = ksiazka.ilosc_sztuk
    db_ksiazka.kategoria_id = ksiazka.kategoria_id

    # 3. Zapisujemy zmiany
    db.commit()
    db.refresh(db_ksiazka)
    return db_ksiazka


@app.delete("/ksiazki/{ksiazka_id}")
def usun_ksiazke(ksiazka_id: int, db: Session = Depends(get_db)):
    # 1. Szukamy książki
    db_ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == ksiazka_id).first()
    
    if not db_ksiazka:
        raise HTTPException(status_code=404, detail="Podana książka nie istnieje!")

    # 2. Usuwamy ją z bazy
    db.delete(db_ksiazka)
    db.commit()
    return {"wiadomosc": f"Książka o ID {ksiazka_id} została pomyślnie usunięta."}