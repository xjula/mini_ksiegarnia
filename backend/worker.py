import os
import json
import pika
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from database import engine  
import models 
from datetime import datetime, timedelta
from sqlalchemy import func

load_dotenv()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- LOGIKA TRENDÓW  ---
def wylicz_trend(db, book_id: int) -> str:
    tydzien_temu = datetime.utcnow() - timedelta(days=7)
    sprzedaz_tygodniowa = db.query(func.sum(models.KsiazkaZamowienie.ilosc))\
        .join(models.Zamowienie)\
        .filter(models.KsiazkaZamowienie.ksiazka_id == book_id)\
        .filter(models.Zamowienie.data_zamowienia >= tydzien_temu)\
        .scalar() or 0
    
    if sprzedaz_tygodniowa >= 10: return "up"     
    elif sprzedaz_tygodniowa == 0: return "down"   
    return "stable"

# --- CALLBACK DLA TRENDÓW ---
def callback_trendy(ch, method, properties, body):
    dane = json.loads(body)
    book_id = dane.get("book_id")
    db = SessionLocal()
    try:
        ksiazka = db.query(models.Ksiazka).filter(models.Ksiazka.id == book_id).first()
        if ksiazka:
            ksiazka.trend = wylicz_trend(db, book_id)
            trend_record = db.query(models.Trend).filter(models.Trend.ksiazka_id == book_id).first()
            sprzedaz = db.query(func.sum(models.KsiazkaZamowienie.ilosc)).join(models.Zamowienie).filter(models.KsiazkaZamowienie.ksiazka_id == book_id).scalar() or 0

            if trend_record:
                trend_record.ocena = float(sprzedaz)
                trend_record.data_aktualizacji = datetime.utcnow()
            else:
                db.add(models.Trend(ksiazka_id=book_id, ocena=float(sprzedaz), data_aktualizacji=datetime.utcnow()))
            
            db.commit()
            print(f"[+] Zaktualizowano trend dla ID {book_id}")
    except Exception as e:
        print(f"[!] Błąd trendy: {e}")
        db.rollback()
    finally:
        db.close()
    ch.basic_ack(delivery_tag=method.delivery_tag)

# --- CALLBACK DLA PŁATNOŚCI ---
def callback_platnosci(ch, method, properties, body):
    try:
        dane = json.loads(body)
        zamowienie_id = dane.get("zamowienie_id")
        
        print(f"[!] Przetwarzanie płatności dla zamówienia ID: {zamowienie_id}")
        
        db = SessionLocal()
        
        zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id == zamowienie_id).first()
        
        if zamowienie:
            zamowienie.status = "opłacone"
            db.commit()
            print(f"[+] Zamówienie {zamowienie_id} zostało oznaczone jako opłacone.")
        else:
            print(f"[-] Nie znaleziono zamówienia o ID: {zamowienie_id}")
            
    except Exception as e:
        print(f"[!] Błąd podczas przetwarzania płatności: {e}")
        db.rollback()
    finally:
        db.close()

    ch.basic_ack(delivery_tag=method.delivery_tag)


# --- MAIN ---
def main():
    url = os.getenv("RABBITMQ_URL")
    params = pika.URLParameters(url)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    # Deklaracja obu kolejek
    channel.queue_declare(queue='trendy_kolejka')
    channel.queue_declare(queue='platnosci')

    # Podpięcie konsumentów
    channel.basic_consume(queue='trendy_kolejka', on_message_callback=callback_trendy)
    channel.basic_consume(queue='platnosci', on_message_callback=callback_platnosci)

    print(' [*] Worker gotowy. Oczekuje na wiadomości w obu kolejkach...')
    channel.start_consuming()

if __name__ == '__main__':
    main()