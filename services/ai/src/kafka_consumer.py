from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'ai-events',
    bootstrap_servers=['localhost:9092'],
    auto_offset_reset='earliest',
    group_id='ai-service-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

print("AI Service Kafka Consumer is running...")

for message in consumer:
    event = message.value
    print(f"Received event: {event}")
    # Process the event here