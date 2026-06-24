from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import func
import models
from services.trend_service import aktualizuj_trend_w_bazie


def dodaj_recenzje(recenzja, db):
    nowa_recenzja = models.Recenzja(**recenzja.model_dump())
    db.add(nowa_recenzja)
    db.commit()
    db.refresh(nowa_recenzja)

    db_uzytkownik = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id == recenzja.uzytkownik_id
    ).first()

    pelna_nazwa = db_uzytkownik.full_name if db_uzytkownik else "Użytkownik"

    srednia_ocena = db.query(
        func.avg(models.Recenzja.ocena)
    ).filter(
        models.Recenzja.ksiazka_id == recenzja.ksiazka_id
    ).scalar()

    wyliczona_srednia = round(float(srednia_ocena or 0), 2)

    nowy_wpis_trendu = models.Trend(
        ksiazka_id=recenzja.ksiazka_id,
        ocena=wyliczona_srednia,
        data_aktualizacji=datetime.utcnow()
    )

    db.add(nowy_wpis_trendu)
    db.commit()

    aktualizuj_trend_w_bazie(recenzja.ksiazka_id, db)

    return {
        "id": nowa_recenzja.id,
        "ksiazka_id": nowa_recenzja.ksiazka_id,
        "uzytkownik_id": nowa_recenzja.uzytkownik_id,
        "ocena": nowa_recenzja.ocena,
        "komentarz": nowa_recenzja.komentarz,
        "data_dodania": nowa_recenzja.data_dodania,
        "uzytkownik_name": pelna_nazwa
    }


def pobierz_recenzje(db):
    results = db.query(
        models.Recenzja,
        models.Uzytkownik.full_name
    ).join(
        models.Uzytkownik,
        models.Recenzja.uzytkownik_id == models.Uzytkownik.id
    ).all()

    wynik = []

    for recenzja, full_name in results:
        wynik.append({
            "id": recenzja.id,
            "ksiazka_id": recenzja.ksiazka_id,
            "uzytkownik_id": recenzja.uzytkownik_id,
            "ocena": recenzja.ocena,
            "komentarz": recenzja.komentarz,
            "data_dodania": recenzja.data_dodania,
            "uzytkownik_name": full_name if full_name else f"Użytkownik {recenzja.uzytkownik_id}"
        })

    return wynik


def usun_recenzje(recenzja_id: int, db):
    db_recenzja = db.query(models.Recenzja).filter(
        models.Recenzja.id == recenzja_id
    ).first()

    if not db_recenzja:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono takiej recenzji."
        )

    ksiazka_id = db_recenzja.ksiazka_id

    db.delete(db_recenzja)
    db.commit()

    srednia_ocena = db.query(
        func.avg(models.Recenzja.ocena)
    ).filter(
        models.Recenzja.ksiazka_id == ksiazka_id
    ).scalar()

    wyliczona_srednia = round(float(srednia_ocena or 0), 2)

    nowy_wpis_trendu = models.Trend(
        ksiazka_id=ksiazka_id,
        ocena=wyliczona_srednia,
        data_aktualizacji=datetime.utcnow()
    )

    db.add(nowy_wpis_trendu)
    db.commit()

    aktualizuj_trend_w_bazie(ksiazka_id, db)

    return {"wiadomosc": "Recenzja została usunięta"}