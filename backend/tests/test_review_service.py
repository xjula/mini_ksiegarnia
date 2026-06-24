import sys
import os
from unittest.mock import MagicMock
from datetime import datetime
from unittest.mock import MagicMock, patch
from datetime import datetime, UTC

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
from services import review_service



@patch("services.review_service.aktualizuj_trend_w_bazie")
def test_dodaj_recenzje_sukces(mock_trend):
    db = MagicMock()

    recenzja_payload = MagicMock()
    recenzja_payload.model_dump.return_value = {
        "uzytkownik_id": 1,
        "ksiazka_id": 1,
        "ocena": 5,
        "komentarz": "Super książka"
    }
    recenzja_payload.uzytkownik_id = 1
    recenzja_payload.ksiazka_id = 1

    uzytkownik = models.Uzytkownik(
        id=1,
        full_name="Jan Kowalski"
    )

    db.query().filter().first.return_value = uzytkownik
    db.query().filter().scalar.return_value = 5

    result = review_service.dodaj_recenzje(recenzja_payload, db)

    assert result["ksiazka_id"] == 1
    assert result["uzytkownik_id"] == 1
    assert result["ocena"] == 5
    assert result["komentarz"] == "Super książka"
    assert result["uzytkownik_name"] == "Jan Kowalski"
    assert db.add.called
    assert db.commit.called


def test_pobierz_recenzje_sukces():
    db = MagicMock()

    recenzja = models.Recenzja(
        id=1,
        ksiazka_id=1,
        uzytkownik_id=1,
        ocena=4,
        komentarz="Dobra",
        data_dodania=datetime.now(UTC)
    )

    db.query().join().all.return_value = [
        (recenzja, "Anna Nowak")
    ]

    result = review_service.pobierz_recenzje(db)

    assert len(result) == 1
    assert result[0]["id"] == 1
    assert result[0]["uzytkownik_name"] == "Anna Nowak"
    assert result[0]["ocena"] == 4

@patch("services.review_service.aktualizuj_trend_w_bazie")
def test_usun_recenzje_sukces(mock_trend):
    db = MagicMock()

    recenzja = models.Recenzja(
        id=1,
        ksiazka_id=2,
        uzytkownik_id=1,
        ocena=3,
        komentarz="OK"
    )

    db.query().filter().first.return_value = recenzja
    db.query().filter().scalar.return_value = 4

    result = review_service.usun_recenzje(1, db)

    assert result["wiadomosc"] == "Recenzja została usunięta"
    assert db.delete.called
    assert db.commit.called


def test_usun_recenzje_gdy_brak_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        review_service.usun_recenzje(999, db)
        assert False
    except Exception as e:
        assert e.status_code == 404