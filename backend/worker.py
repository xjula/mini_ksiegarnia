import os
import json
import pika
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from database import engine  
from models import Ksiazka
from datetime import datetime, timedelta
from sqlalchemy import func
import models 

load_dotenv()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def wylicz_trend(db, book_id: int) -> str:
    tydzien_temu = datetime.utcnow() - timedelta(days=7)
    
    # Pełne zapytanie - sprawdza powiązania i bierze pod uwagę tylko ostatnie 7 dni
    sprzedaz_tygodniowa = db.query(func.sum(models.KsiazkaZamowienie.ilosc))\
        .join(models.Zamowienie)\
        .filter(models.KsiazkaZamowienie.ksiazka_id == book_id)\
        .filter(models.Zamowienie.data_zamowienia >= tydzien_temu)\
        .scalar() or 0
    
    print(f"[DEBUG] Książka {book_id}, sprzedaż z 7 dni: {sprzedaz_tygodniowa}")
    
    if sprzedaz_tygodniowa >= 10:
        return "up"     
    elif sprzedaz_tygodniowa == 0:
        return "down"   
    return "stable"

def callback(ch, method, properties, body):
    dane = json.loads(body)
    book_id = dane.get("book_id")
    
    db = SessionLocal()
    try:
        ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == book_id).first()
        if ksiazka:
            nowy_trend = wylicz_trend(db, book_id) 
            ksiazka.trend = nowy_trend
            trend_record = db.query(models.Trend).filter(
                models.Trend.ksiazka_id == book_id
            ).first()

            sprzedaz = db.query(
                func.sum(models.KsiazkaZamowienie.ilosc)
            ).join(models.Zamowienie).filter(
                models.KsiazkaZamowienie.ksiazka_id == book_id
            ).scalar() or 0

            if trend_record:
                trend_record.ocena = float(sprzedaz)
                trend_record.data_aktualizacji = datetime.utcnow()
            else:
                trend_record = models.Trend(
                    ksiazka_id=book_id,
                    ocena=float(sprzedaz),
                    data_aktualizacji=datetime.utcnow()
                )
                db.add(trend_record)

            db.commit()
            print(f"[+] Zaktualizowano trend dla '{ksiazka.tytul}' na '{nowy_trend}' na podstawie sprzedaży z 7 dni")
        else:
            print(f"[-] Nie znaleziono książki o ID: {book_id} w bazie.")
    except Exception as e:
        print(f"[!] Błąd bazy danych: {e}")
        db.rollback()  
    finally:
        db.close()   
            
    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    url = os.getenv("RABBITMQ_URL")
    if not url:
        print("[!] Brak zmiennej środowiskowej RABBITMQ_URL w pliku .env!")
        return

    params = pika.URLParameters(url)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    channel.queue_declare(queue='trendy_kolejka')

    channel.basic_consume(queue='trendy_kolejka', on_message_callback=callback)

    print(' [*] Worker uruchomiony! Czekam na wiadomości w "trendy_kolejka"... Naciśnij CTRL+C aby wyjść.')
    
    channel.start_consuming()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n[!] Przerwano działanie workera.')