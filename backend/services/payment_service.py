import stripe
from fastapi import HTTPException
import models
from services.rabbitmq_service import wyslij_do_kolejki


def ustaw_platnosc_offline(zamowienie_id: int, db):
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


def zatwierdz_platnosc_offline(zamowienie_id: int, db):
    zamowienie = db.query(models.Zamowienie).filter(
        models.Zamowienie.id == zamowienie_id
    ).first()

    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    if zamowienie.status != "OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE":
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


def zaplac_za_zamowienie(zamowienie_id: int, karta, db):
    zamowienie = db.query(models.Zamowienie).filter(
        models.Zamowienie.id == zamowienie_id
    ).first()

    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    if zamowienie.status == "OPŁACONE":
        raise HTTPException(
            status_code=400,
            detail="To zamówienie zostało już opłacone."
        )

    kwota_w_groszach = int(round(zamowienie.cena_calkowita * 100))

    try:
        intent = stripe.PaymentIntent.create(
            amount=kwota_w_groszach,
            currency="pln",
            payment_method=karta.metoda_platnosci,
            payment_method_types=["card"],
            confirm=True
        )

        zamowienie.status = "OPŁACONE"

        platnosc = models.Platnosc(
            zamowienia_id=zamowienie.id,
            status="SUCCESS",
            metoda_platnosci="ONLINE_STRIPE",
            platnosc_id=intent.id
        )

        db.add(platnosc)
        db.commit()

        wyslij_do_kolejki("platnosci", {
            "zamowienie_id": zamowienie_id,
            "status": "OPŁACONE",
            "kwota": kwota_w_groszach / 100
        })

        return {
            "wiadomosc": "Płatność zakończona sukcesem!",
            "status": zamowienie.status
        }

    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=f"Błąd karty: {str(e)}")

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Błąd Stripe: {str(e)}")