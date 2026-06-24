from fastapi import HTTPException
import models


def dodaj_adres(adres, db):
    nowy_adres = models.Adres(**adres.model_dump())
    db.add(nowy_adres)
    db.commit()
    db.refresh(nowy_adres)
    return nowy_adres


def pobierz_adresy(db):
    return db.query(models.Adres).all()


def pobierz_adresy_uzytkownika(uzytkownik_id: int, db):
    uzytkownik = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id == uzytkownik_id
    ).first()

    if not uzytkownik:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    return db.query(models.Adres).filter(
        models.Adres.uzytkownik_id == uzytkownik_id
    ).all()