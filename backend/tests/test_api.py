import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_ksiazki_endpoint():
    response = client.get("/ksiazki/")
    assert response.status_code == 200


def test_get_kategorie_endpoint():
    response = client.get("/kategorie/")
    assert response.status_code == 200


def test_get_recenzje_endpoint():
    response = client.get("/recenzje/")
    assert response.status_code == 200


def test_get_zamowienia_endpoint():
    response = client.get("/zamowienia/")
    assert response.status_code == 200


def test_login_bledne_dane():
    response = client.post("/login", json={
        "email": "nieistnieje@test.pl",
        "haslo": "zlehaslo"
    })

    assert response.status_code == 401


def test_adresy_nieistniejacego_uzytkownika():
    response = client.get("/uzytkownicy/999999/adresy")
    assert response.status_code == 404