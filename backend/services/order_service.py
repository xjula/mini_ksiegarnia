from fastapi import HTTPException
import models
from models import Ksiazka
from services.trend_service import aktualizuj_trend_w_bazie
from services.rabbitmq_service import wyslij_do_kolejki


def pobierz_zamowienia(db):
    return db.query(models.Zamowienie).all()


def pobierz_zamowienie(zamowienie_id: int, db):
    zamowienie = db.query(models.Zamowienie).filter(
        models.Zamowienie.id == zamowienie_id
    ).first()

    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    return zamowienie


def zmien_status_zamowienia(zamowienie_id: int, dane, db):
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


def stworz_zamowienie(zamowienie, db):
    laczna_cena = 0.0
    kupione_ksiazki_ids = []

    nowe_zamowienie = models.Zamowienie(
        uzytkownik_id=zamowienie.uzytkownik_id,
        status="PENDING",
        cena_calkowita=0.0,
        koszt_dostawy=zamowienie.koszt_dostawy
    )

    db.add(nowe_zamowienie)
    db.commit()
    db.refresh(nowe_zamowienie)

    for item in zamowienie.produkty:
        db_book = db.query(Ksiazka).filter(
            Ksiazka.id == item.id_ksiazki
        ).first()

        if db_book:
            laczna_cena += db_book.cena_jednostkowa * item.ilosc
            db_book.ilosc_sztuk -= item.ilosc
            kupione_ksiazki_ids.append(item.id_ksiazki)

            pozycja = models.KsiazkaZamowienie(
                zamowienia_id=nowe_zamowienie.id,
                ksiazka_id=db_book.id,
                ilosc=item.ilosc,
                cena=db_book.cena_jednostkowa
            )

            db.add(pozycja)

    nowe_zamowienie.cena_calkowita = laczna_cena + zamowienie.koszt_dostawy
    db.commit()

    for book_id in kupione_ksiazki_ids:
        aktualizuj_trend_w_bazie(book_id, db)

        wyslij_do_kolejki("trendy_kolejka", {
            "book_id": book_id,
            "akcja": "przelicz_trend"
        })

    return {
        "status": "success",
        "zamowienie_id": nowe_zamowienie.id
    }

def pobierz_zamowienia_uzytkownika(uzytkownik_id: int, db):
    return db.query(models.Zamowienie).filter(
        models.Zamowienie.uzytkownik_id == uzytkownik_id
    ).all()