import pika
import pika.channel
import pika.spec
import json
import sys
import os
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.services.thumbnail import thumbnail_service
from app.services.ranchbot_api import api_client


def process_thumbnail_job(ch: pika.channel.Channel, method: pika.spec.Basic.Deliver, properties: pika.spec.BasicProperties, body: bytes) -> None:
    try:
        data = json.loads(body)
        job_id = data['job_id']
        clip_id = data['clip_id']
        endpoint = data['endpoint']
        args = data['args']
        token = data['token']

        print(f"Processing thumbnail job {job_id} for clip {clip_id}")

        video_data = asyncio.run(api_client.call_api_for_blob(
            endpoint=endpoint,
            args=args,
            token=token
        ))

        thumbnail_data = thumbnail_service.extract_thumbnail(video_data, clip_id)

        print(f"Successfully processed thumbnail for clip {clip_id} ({len(thumbnail_data)} bytes)")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"Error processing thumbnail job: {e}")
        import traceback
        traceback.print_exc()
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main() -> None:
    print(f"Starting thumbnail worker...")
    print(f"Connecting to RabbitMQ at {settings.rabbitmq_host}:{settings.rabbitmq_port}")

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

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    channel.queue_declare(queue='thumbnails', durable=True)
    channel.basic_qos(prefetch_count=settings.thumbnail_worker_prefetch)

    channel.basic_consume(
        queue='thumbnails',
        on_message_callback=process_thumbnail_job
    )

    print("Thumbnail worker started. Waiting for jobs...")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("Stopping worker...")
        channel.stop_consuming()
        connection.close()


if __name__ == '__main__':
    main()
