from kafka import KafkaConsumer
import pika
import json

# Kafka Consumer Setup
kafka_consumer = KafkaConsumer(
    'search-events',
    bootstrap_servers=['localhost:9092'],
    auto_offset_reset='earliest',
    group_id='search-service'
)

# RabbitMQ Consumer Setup
def rabbitmq_consume():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()
    channel.queue_declare(queue='search-events')

    def callback(ch, method, properties, body):
        event = json.loads(body)
        process_event(event)

    channel.basic_consume(queue='search-events', on_message_callback=callback, auto_ack=True)
    print('Waiting for RabbitMQ messages...')
    channel.start_consuming()

# Event Processing
def process_event(event):
    print(f"Processing event: {event}")
    # Add logic to update OpenSearch index or embeddings

# Start Kafka Consumer
for message in kafka_consumer:
    event = json.loads(message.value)
    process_event(event)