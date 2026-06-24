import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from worker import wylicz_trend


def test_wylicz_trend_up():
    db = MagicMock()

    db.query().join().filter().filter().scalar.return_value = 15

    result = wylicz_trend(db, 1)

    assert result == "up"


def test_wylicz_trend_down():
    db = MagicMock()

    db.query().join().filter().filter().scalar.return_value = 0

    result = wylicz_trend(db, 1)

    assert result == "down"


def test_wylicz_trend_stable():
    db = MagicMock()

    db.query().join().filter().filter().scalar.return_value = 5

    result = wylicz_trend(db, 1)

    assert result == "stable"