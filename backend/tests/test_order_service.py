import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from types import SimpleNamespace
from unittest.mock import MagicMock

import models
from services import order_service


def test_stworz_zamowienie_liczy_cene_i_koszt_dostawy():
    db = MagicMock()

    ksiazka = models.Ksiazka(
        id=1,
        cena_jednostkowa=40,
        ilosc_sztuk=10
    )

    db.query().filter().first.return_value = ksiazka

    zamowienie = SimpleNamespace(
        uzytkownik_id=1,
        koszt_dostawy=15,
        produkty=[
            SimpleNamespace(id_ksiazki=1, ilosc=2)
        ]
    )

    result = order_service.stworz_zamowienie(zamowienie, db)

    assert result["status"] == "success"
    assert ksiazka.ilosc_sztuk == 8


def test_pobierz_zamowienie_gdy_brak_rzuca_404():
    db = MagicMock()
    db.query().filter().first.return_value = None

    try:
        order_service.pobierz_zamowienie(999, db)
        assert False
    except Exception as e:
        assert e.status_code == 404