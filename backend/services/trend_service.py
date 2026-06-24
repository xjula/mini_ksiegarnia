from sqlalchemy.orm import Session
import models

def aktualizuj_trend_w_bazie(book_id: int, db: Session):
    db_book = db.query(models.Ksiazka).filter(models.Ksiazka.id == book_id).first()
    if not db_book:
        return

    score = 0
    wszystkie_recenzje = db.query(models.Recenzja).filter(models.Recenzja.ksiazka_id == book_id).all()
    for r in wszystkie_recenzje:
        if r.ocena == 5: score += 10
        elif r.ocena == 4: score += 5
        elif r.ocena == 2: score -= 5
        elif r.ocena == 1: score -= 10

    if db_book.ilosc_sztuk <= 5:
        score += 30
    elif db_book.ilosc_sztuk > 20:
        score -= 10

    if score >= 20:
        nowy_trend = "up"
    elif score <= -20:
        nowy_trend = "down"
    else:
        nowy_trend = "stable"

    db_book.trend = nowy_trend
    db.commit()