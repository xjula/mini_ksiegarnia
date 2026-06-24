import os
import json
import pika


def wyslij_do_kolejki(nazwa_kolejki: str, wiadomosc: dict):
    try:
        url = os.getenv("RABBITMQ_URL")
        params = pika.URLParameters(url)

        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        channel.queue_declare(queue=nazwa_kolejki)

        channel.basic_publish(
            exchange="",
            routing_key=nazwa_kolejki,
            body=json.dumps(wiadomosc)
        )

        connection.close()

    except Exception as err:
        print(f"Błąd RabbitMQ: {err}")