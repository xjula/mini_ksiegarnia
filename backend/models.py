from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Kategoria(Base):
    __tablename__ = "kategorie"

    id = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String, unique=True, index=True)

    # Relacja - jedna kategoria ma wiele książek
    ksiazki = relationship("Ksiazka", back_populates="kategoria")

class Ksiazka(Base):
    __tablename__ = "ksiazki"

    id = Column(Integer, primary_key=True, index=True)
    tytul = Column(String, index=True)
    autor = Column(String, index=True)
    opis = Column(String)
    cena_jednostkowa = Column(Float)
    ilosc_sztuk = Column(Integer, default=0) 
    kategoria_id = Column(Integer, ForeignKey("kategorie.id"))

    # Relacja zwrotna
    kategoria = relationship("Kategoria", back_populates="ksiazki")