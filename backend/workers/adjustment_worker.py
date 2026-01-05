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
from app.services.ranchbot_api import api_client


def process_adjustment_job(ch: pika.channel.Channel, method: pika.spec.Basic.Deliver, properties: pika.spec.BasicProperties, body: bytes) -> None:
    try:
        data = json.loads(body)
        job_id = data['job_id']
        clip_index = data['clip_index']
        left_adjust = data['left_adjust']
        right_adjust = data['right_adjust']
        token = data['token']

        print(f"Processing adjustment job {job_id} for clip {clip_index} (left:{left_adjust}, right:{right_adjust})")

        video_data = asyncio.run(api_client.call_api_for_blob(
            endpoint='/ad',
            args=[clip_index, left_adjust, right_adjust],
            token=token
        ))

        cache_dir = settings.adjusted_video_cache_dir
        os.makedirs(cache_dir, exist_ok=True)

        safe_job_id = os.path.basename(job_id)
        cache_path = os.path.join(cache_dir, f"{safe_job_id}.mp4")
        with open(cache_path, 'wb') as f:
            f.write(video_data)

        print(f"Successfully processed adjustment for clip {clip_index} ({len(video_data)} bytes, saved to {cache_path})")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"Error processing adjustment job: {e}")
        import traceback
        traceback.print_exc()
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main() -> None:
    print(f"Starting adjustment worker...")
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

    channel.queue_declare(queue='adjustments', durable=True)
    channel.basic_qos(prefetch_count=settings.adjustment_worker_prefetch)

    channel.basic_consume(
        queue='adjustments',
        on_message_callback=process_adjustment_job
    )

    print("Adjustment worker started. Waiting for jobs...")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("Stopping worker...")
        channel.stop_consuming()
        connection.close()


if __name__ == '__main__':
    main()
