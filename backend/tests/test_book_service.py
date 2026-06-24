import sys
import os
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
from services import book_service


def test_dodaj_ksiazke_sukces():
    db = MagicMock()

    kategoria = models.Kategoria(id=1, nazwa="Fantasy")
    db.query().filter().first.return_value = kategoria

    ksiazka_payload = MagicMock()
    ksiazka_payload.kategoria_id = 1
    ksiazka_payload.model_dump.return_value = {
        "tytul": "Testowa książka",
        "autor": "Autor",
        "opis": "Opis",
        "wydawnictwo": "Wydawnictwo",
        "jezyk_wydania": "polski",
        "numer_wydania": 1,
        "okladka": "brak",
        "cena_jednostkowa": 50.0,
        "ilosc_sztuk": 10,
        "kategoria_id": 1,
        "trend": "stable"
    }

    result = book_service.dodaj_ksiazke(ksiazka_payload, db)

    assert result.tytul == "Testowa książka"
    assert result.kategoria_id == 1
    assert db.add.called
    assert db.commit.called


def test_dodaj_ksiazke_gdy_brak_kategorii_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    ksiazka_payload = MagicMock()
    ksiazka_payload.kategoria_id = 999

    try:
        book_service.dodaj_ksiazke(ksiazka_payload, db)
        assert False
    except Exception as e:
        assert e.status_code == 404


@patch("services.book_service.aktualizuj_trend_w_bazie")
def test_pobierz_ksiazki_sukces(mock_trend):
    db = MagicMock()

    book = SimpleNamespace(
        id=1,
        tytul="Testowa książka",
        autor="Autor",
        opis="Opis",
        wydawnictwo="Wydawnictwo",
        jezyk_wydania="polski",
        numer_wydania=1,
        data_premiery="2024-01-01",
        okladka="brak",
        cena_jednostkowa=50.0,
        ilosc_sztuk=4,
        kategoria_id=1,
        trend="up",
        kategoria_nazwa="Fantasy"
    )

    recenzja = models.Recenzja(ocena=5)

    db.query().join().all.return_value = [book]
    db.query().filter().scalar.return_value = 5
    db.query().filter().count.return_value = 1
    db.query().filter().all.return_value = [recenzja]

    result = book_service.pobierz_ksiazki(db)

    assert len(result) == 1
    assert result[0]["title"] == "Testowa książka"
    assert result[0]["category"] == "Fantasy"
    assert result[0]["rating"] == 5.0
    assert result[0]["reviewCount"] == 1


def test_edytuj_ksiazke_sukces():
    db = MagicMock()

    db_book = models.Ksiazka(
        id=1,
        tytul="Stary tytuł",
        autor="Stary autor"
    )

    db.query().filter().first.return_value = db_book

    update_payload = MagicMock()
    update_payload.tytul = "Nowy tytuł"
    update_payload.autor = "Nowy autor"
    update_payload.opis = "Nowy opis"
    update_payload.cena_jednostkowa = 60.0
    update_payload.ilosc_sztuk = 20
    update_payload.kategoria_id = 1
    update_payload.wydawnictwo = "Nowe wydawnictwo"
    update_payload.jezyk_wydania = "polski"
    update_payload.numer_wydania = 2
    update_payload.okladka = "okladka"
    update_payload.trend = "stable"

    result = book_service.edytuj_ksiazke(1, update_payload, db)

    assert result.tytul == "Nowy tytuł"
    assert result.autor == "Nowy autor"
    assert result.cena_jednostkowa == 60.0
    assert db.commit.called


def test_edytuj_ksiazke_gdy_brak_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        book_service.edytuj_ksiazke(999, MagicMock(), db)
        assert False
    except Exception as e:
        assert e.status_code == 404


def test_usun_ksiazke_sukces():
    db = MagicMock()

    db_ksiazka = models.Ksiazka(id=1, tytul="Do usunięcia")
    db.query().filter().first.return_value = db_ksiazka

    result = book_service.usun_ksiazke(1, db)

    assert "została pomyślnie usunięta" in result["wiadomosc"]
    assert db.delete.called
    assert db.commit.called


def test_usun_ksiazke_gdy_brak_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        book_service.usun_ksiazke(999, db)
        assert False
    except Exception as e:
        assert e.status_code == 404