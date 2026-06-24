import sys
import os
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
from services import payment_service


def test_ustaw_platnosc_offline_zmienia_status():
    db = MagicMock()

    zamowienie = models.Zamowienie(
        id=1,
        status="PENDING"
    )

    db.query().filter().first.return_value = zamowienie

    result = payment_service.ustaw_platnosc_offline(1, db)

    assert result["status"] == "OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE"
    assert zamowienie.status == "OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE"
    assert db.add.called
    assert db.commit.called


def test_ustaw_platnosc_offline_gdy_brak_zamowienia_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        payment_service.ustaw_platnosc_offline(999, db)
        assert False
    except Exception as e:
        assert e.status_code == 404


def test_zatwierdz_platnosc_offline_zmienia_status_na_oplacone():
    db = MagicMock()

    zamowienie = models.Zamowienie(
        id=1,
        status="OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE"
    )

    platnosc = models.Platnosc(
        zamowienia_id=1,
        status="PENDING_OFFLINE",
        metoda_platnosci="OFFLINE"
    )

    db.query().filter().first.side_effect = [
        zamowienie,
        platnosc
    ]

    result = payment_service.zatwierdz_platnosc_offline(1, db)

    assert result["status"] == "OPŁACONE"
    assert zamowienie.status == "OPŁACONE"
    assert platnosc.status == "SUCCESS_OFFLINE"
    assert db.commit.called


def test_zatwierdz_platnosc_offline_gdy_zly_status_rzuca_400():
    db = MagicMock()

    zamowienie = models.Zamowienie(
        id=1,
        status="PENDING"
    )

    db.query().filter().first.return_value = zamowienie

    try:
        payment_service.zatwierdz_platnosc_offline(1, db)
        assert False
    except Exception as e:
        assert e.status_code == 400


@patch("services.payment_service.wyslij_do_kolejki")
@patch("services.payment_service.stripe.PaymentIntent.create")
def test_zaplac_za_zamowienie_online_sukces(mock_stripe_create, mock_queue):
    db = MagicMock()

    zamowienie = models.Zamowienie(
        id=1,
        status="PENDING",
        cena_calkowita=65.0
    )

    db.query().filter().first.return_value = zamowienie

    mock_intent = MagicMock()
    mock_intent.id = "pi_test_123"
    mock_stripe_create.return_value = mock_intent

    result = payment_service.zaplac_za_zamowienie(
        1,
        MagicMock(metoda_platnosci="pm_card_visa"),
        db
    )

    assert result["status"] == "OPŁACONE"
    assert zamowienie.status == "OPŁACONE"
    assert db.add.called
    assert db.commit.called
    assert mock_queue.called


def test_zaplac_za_zamowienie_gdy_brak_zamowienia_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        payment_service.zaplac_za_zamowienie(
            999,
            MagicMock(metoda_platnosci="pm_card_visa"),
            db
        )
        assert False
    except Exception as e:
        assert e.status_code == 404