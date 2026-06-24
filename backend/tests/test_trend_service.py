import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
from services import trend_service


def test_aktualizuj_trend_gdy_brak_ksiazki_nic_nie_robi():
    db = MagicMock()
    db.query().filter().first.return_value = None

    result = trend_service.aktualizuj_trend_w_bazie(999, db)

    assert result is None
    assert not db.commit.called


def test_aktualizuj_trend_up_przy_wysokich_ocenach_i_malym_stanie():
    db = MagicMock()

    ksiazka = models.Ksiazka(
        id=1,
        ilosc_sztuk=3,
        trend="stable"
    )

    recenzje = [
        models.Recenzja(ocena=5),
        models.Recenzja(ocena=5)
    ]

    db.query().filter().first.return_value = ksiazka
    db.query().filter().all.return_value = recenzje

    trend_service.aktualizuj_trend_w_bazie(1, db)

    assert ksiazka.trend == "up"
    assert db.commit.called


def test_aktualizuj_trend_down_przy_niskich_ocenach_i_duzym_stanie():
    db = MagicMock()

    ksiazka = models.Ksiazka(
        id=1,
        ilosc_sztuk=30,
        trend="stable"
    )

    recenzje = [
        models.Recenzja(ocena=1),
        models.Recenzja(ocena=1)
    ]

    db.query().filter().first.return_value = ksiazka
    db.query().filter().all.return_value = recenzje

    trend_service.aktualizuj_trend_w_bazie(1, db)

    assert ksiazka.trend == "down"
    assert db.commit.called


def test_aktualizuj_trend_stable_przy_srednim_wyniku():
    db = MagicMock()

    ksiazka = models.Ksiazka(
        id=1,
        ilosc_sztuk=10,
        trend="up"
    )

    recenzje = [
        models.Recenzja(ocena=4),
        models.Recenzja(ocena=2)
    ]

    db.query().filter().first.return_value = ksiazka
    db.query().filter().all.return_value = recenzje

    trend_service.aktualizuj_trend_w_bazie(1, db)

    assert ksiazka.trend == "stable"
    assert db.commit.called