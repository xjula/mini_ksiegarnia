import os
import json
import pika
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from database import engine  
from models import Ksiazka

load_dotenv()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def wylicz_trend(ilosc_sztuk: int) -> str:
    """Prosty algorytm wyliczający trend na podstawie stanu magazynu."""
    if ilosc_sztuk <= 5:
        return "up"
    elif ilosc_sztuk >= 20:
        return "down"
    return "stable"

def callback(ch, method, properties, body):
    """Ta funkcja odpala się automatycznie, gdy w kolejce pojawi się nowa wiadomość."""
    dane = json.loads(body)
    book_id = dane.get("book_id")
    akcja = dane.get("akcja")

    if akcja == "przelicz_trend" and book_id:
        print(f"[*] Rozpoczynam przeliczanie trendu dla książki ID: {book_id}")
  
        db = SessionLocal()
        try:
            ksiazka = db.query(Ksiazka).filter(Ksiazka.id == book_id).first()
            if ksiazka:
                nowy_trend = wylicz_trend(ksiazka.ilosc_sztuk)
                ksiazka.trend = nowy_trend
                db.commit()
                print(f"[+] Zaktualizowano trend na '{nowy_trend}' dla '{ksiazka.tytul}'")
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