import pika
import json
from app.core.config import settings


class QueueManager:
    def __init__(self):
        self.connection = None
        self.channel = None

    def connect(self):
        """Establishes RabbitMQ connection if not already connected. Reuses existing connection to avoid overhead."""
        if self.connection and not self.connection.is_closed:
            return

        credentials = pika.PlainCredentials(
            settings.rabbitmq_user,
            settings.rabbitmq_pass
        )
        parameters = pika.ConnectionParameters(
            host=settings.rabbitmq_host,
            port=settings.rabbitmq_port,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )

        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()

        self.channel.queue_declare(queue='thumbnails', durable=True)
        self.channel.queue_declare(queue='adjustments', durable=True)

    def publish_thumbnail_job(self, job_id: str, clip_id: str, endpoint: str, args: list, token: str):
        self.connect()

        message = json.dumps({
            'job_id': job_id,
            'clip_id': clip_id,
            'endpoint': endpoint,
            'args': args,
            'token': token
        })

        self.channel.basic_publish(
            exchange='',
            routing_key='thumbnails',
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

    def publish_adjustment_job(self, job_id: str, clip_index: int, left_adjust: int, right_adjust: int, token: str):
        self.connect()

        message = json.dumps({
            'job_id': job_id,
            'clip_index': clip_index,
            'left_adjust': left_adjust,
            'right_adjust': right_adjust,
            'token': token
        })

        self.channel.basic_publish(
            exchange='',
            routing_key='adjustments',
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )



    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()


queue_manager = QueueManager()
