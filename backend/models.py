from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Kategoria(Base):
    __tablename__ = "kategorie"

    id = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String, unique=True, index=True)

    ksiazki = relationship("Ksiazka", back_populates="kategoria")

class Ksiazka(Base):
    __tablename__ = "ksiazki"
    id = Column(Integer, primary_key=True, index=True)
    tytul = Column(String, index=True)
    autor = Column(String, index=True)
    opis = Column(String)
    seria = Column(String, nullable=True)
    wydawnictwo = Column(String)
    jezyk_wydania = Column(String)
    numer_wydania = Column(Integer)
    data_premiery = Column(DateTime)
    okladka = Column(String)
    cena_jednostkowa = Column(Float)
    ilosc_sztuk = Column(Integer)
    kategoria_id = Column(Integer, ForeignKey("kategorie.id"))

    kategoria = relationship("Kategoria", back_populates="ksiazki")
    zamowienia_link = relationship("KsiazkaZamowienie", back_populates="ksiazka")
    recenzje = relationship("Recenzja", back_populates="ksiazka")
    trendy = relationship("Trend", back_populates="ksiazka")

class Uzytkownik(Base):
    __tablename__ = "uzytkownicy"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    haslo = Column(String)
    oauth = Column(Boolean, default=False)
    rola = Column(String, default="user")
    data_dodania = Column(DateTime, default=datetime.datetime.utcnow)
    
    adresy = relationship("Adres", back_populates="uzytkownik")
    zamowienia = relationship("Zamowienie", back_populates="uzytkownik")
    recenzje = relationship("Recenzja", back_populates="uzytkownik")

class Zamowienie(Base):
    __tablename__ = "zamowienia"
    id = Column(Integer, primary_key=True, index=True)
    uzytkownik_id = Column(Integer, ForeignKey("uzytkownicy.id"))
    status = Column(String)
    cena_calkowita = Column(Float)
    data_zamowienia = Column(DateTime, default=datetime.datetime.utcnow)
    adres_id = Column(Integer, ForeignKey("adresy.id"))
    metoda_dostawy = Column(String)
    koszt_dostawy = Column(Float)

    uzytkownik = relationship("Uzytkownik", back_populates="zamowienia")
    adres = relationship("Adres", back_populates="zamowienia")
    ksiazki_link = relationship("KsiazkaZamowienie", back_populates="zamowienie")
    platnosc = relationship("Platnosc", back_populates="zamowienie", uselist=False)

class KsiazkaZamowienie(Base):
    __tablename__ = "ksiazka_zamowienia"
    id = Column(Integer, primary_key=True, index=True)
    ilosc = Column(Integer)
    cena = Column(Float)
    ksiazka_id = Column(Integer, ForeignKey("ksiazki.id"))
    zamowienia_id = Column(Integer, ForeignKey("zamowienia.id"))

    ksiazka = relationship("Ksiazka", back_populates="zamowienia_link")
    zamowienie = relationship("Zamowienie", back_populates="ksiazki_link")

class Platnosc(Base):
    __tablename__ = "platnosci"
    id = Column(Integer, primary_key=True, index=True)
    zamowienia_id = Column(Integer, ForeignKey("zamowienia.id"))
    status = Column(String)
    metoda_platnosci = Column(String)
    platnosc_id = Column(String)

    zamowienie = relationship("Zamowienie", back_populates="platnosc")

class Recenzja(Base):
    __tablename__ = "recenzje"
    id = Column(Integer, primary_key=True, index=True)
    uzytkownik_id = Column(Integer, ForeignKey("uzytkownicy.id"))
    ksiazka_id = Column(Integer, ForeignKey("ksiazki.id"))
    ocena = Column(Integer)
    komentarz = Column(String)
    data_dodania = Column(DateTime, default=datetime.datetime.utcnow)

    uzytkownik = relationship("Uzytkownik", back_populates="recenzje")
    ksiazka = relationship("Ksiazka", back_populates="recenzje")

class Trend(Base):
    __tablename__ = "trendy"
    id = Column(Integer, primary_key=True, index=True)
    ksiazka_id = Column(Integer, ForeignKey("ksiazki.id"))
    ocena = Column(Float)
    data_aktualizacji = Column(DateTime, default=datetime.datetime.utcnow)

    ksiazka = relationship("Ksiazka", back_populates="trendy")

class Adres(Base):
    __tablename__ = "adresy"
    id = Column(Integer, primary_key=True, index=True)
    uzytkownik_id = Column(Integer, ForeignKey("uzytkownicy.id"))
    ulica_i_numer = Column(String)
    kod_pocztowy = Column(String)
    miasto = Column(String)
    kraj = Column(String)
    
    uzytkownik = relationship("Uzytkownik", back_populates="adresy")
    zamowienia = relationship("Zamowienie", back_populates="adres")