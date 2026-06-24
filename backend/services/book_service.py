from fastapi import HTTPException
from sqlalchemy import func
import models
from models import Ksiazka, Kategoria
from services.trend_service import aktualizuj_trend_w_bazie


def dodaj_ksiazke(ksiazka, db):
    kategoria_istnieje = db.query(models.Kategoria).filter(
        models.Kategoria.id == ksiazka.kategoria_id
    ).first()

    if not kategoria_istnieje:
        raise HTTPException(
            status_code=404,
            detail="Podana kategoria nie istnieje!"
        )

    nowa_ksiazka = models.Ksiazka(**ksiazka.model_dump())
    db.add(nowa_ksiazka)
    db.commit()
    db.refresh(nowa_ksiazka)

    return nowa_ksiazka


def pobierz_ksiazki(db):
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

    books_list = []

    for book in results:
        aktualizuj_trend_w_bazie(book.id, db)

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

        wyliczona_ocena = round(float(srednia_ocena or 0), 1)

        score = 0
        wszystkie_recenzje = db.query(models.Recenzja).filter(
            models.Recenzja.ksiazka_id == book.id
        ).all()

        for r in wszystkie_recenzje:
            if r.ocena == 5:
                score += 10
            elif r.ocena == 4:
                score += 5
            elif r.ocena == 2:
                score -= 5
            elif r.ocena == 1:
                score -= 10

        if book.ilosc_sztuk <= 5:
            score += 30
        elif book.ilosc_sztuk > 20:
            score -= 10

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
            "trend": str(book.trend or "stable"),
            "trend_score": score,
            "rating": wyliczona_ocena,
            "reviewCount": liczba_recenzji
        })

    return books_list


def edytuj_ksiazke(book_id, book_update, db):
    db_book = db.query(models.Ksiazka).filter(
        models.Ksiazka.id == book_id
    ).first()

    if not db_book:
        raise HTTPException(status_code=404, detail="Nie znaleziono książki")

    db_book.tytul = book_update.tytul
    db_book.autor = book_update.autor
    db_book.opis = book_update.opis
    db_book.cena_jednostkowa = book_update.cena_jednostkowa
    db_book.ilosc_sztuk = book_update.ilosc_sztuk
    db_book.kategoria_id = book_update.kategoria_id
    db_book.wydawnictwo = book_update.wydawnictwo
    db_book.jezyk_wydania = book_update.jezyk_wydania
    db_book.numer_wydania = book_update.numer_wydania
    db_book.okladka = book_update.okladka
    db_book.trend = book_update.trend

    db.commit()
    db.refresh(db_book)

    return db_book


def usun_ksiazke(ksiazka_id, db):
    db_ksiazka = db.query(models.Ksiazka).filter(
        models.Ksiazka.id == ksiazka_id
    ).first()

    if not db_ksiazka:
        raise HTTPException(
            status_code=404,
            detail="Podana książka nie istnieje!"
        )

    db.delete(db_ksiazka)
    db.commit()

    return {
        "wiadomosc": f"Książka o ID {ksiazka_id} została pomyślnie usunięta."
    }