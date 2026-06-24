import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
from services import address_service


def test_dodaj_adres_sukces():
    db = MagicMock()

    adres_payload = MagicMock()
    adres_payload.model_dump.return_value = {
        "uzytkownik_id": 1,
        "ulica_i_numer": "Kwiatowa 12",
        "kod_pocztowy": "25-001",
        "miasto": "Kielce",
        "kraj": "Polska"
    }

    result = address_service.dodaj_adres(adres_payload, db)

    assert result.uzytkownik_id == 1
    assert result.ulica_i_numer == "Kwiatowa 12"
    assert result.kod_pocztowy == "25-001"
    assert result.miasto == "Kielce"
    assert result.kraj == "Polska"
    assert db.add.called
    assert db.commit.called


def test_pobierz_adresy_sukces():
    db = MagicMock()

    adres = models.Adres(
        id=1,
        uzytkownik_id=1,
        ulica_i_numer="Kwiatowa 12",
        kod_pocztowy="25-001",
        miasto="Kielce",
        kraj="Polska"
    )

    db.query().all.return_value = [adres]

    result = address_service.pobierz_adresy(db)

    assert len(result) == 1
    assert result[0].miasto == "Kielce"


def test_pobierz_adresy_uzytkownika_sukces():
    db = MagicMock()

    uzytkownik = models.Uzytkownik(
        id=1,
        email="test@test.pl",
        full_name="Jan Kowalski"
    )

    adres = models.Adres(
        id=1,
        uzytkownik_id=1,
        ulica_i_numer="Kwiatowa 12",
        kod_pocztowy="25-001",
        miasto="Kielce",
        kraj="Polska"
    )

    db.query().filter().first.return_value = uzytkownik
    db.query().filter().all.return_value = [adres]

    result = address_service.pobierz_adresy_uzytkownika(1, db)

    assert len(result) == 1
    assert result[0].uzytkownik_id == 1
    assert result[0].miasto == "Kielce"


def test_pobierz_adresy_uzytkownika_gdy_brak_uzytkownika_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        address_service.pobierz_adresy_uzytkownika(999, db)
        assert False
    except Exception as e:
        assert e.status_code == 404