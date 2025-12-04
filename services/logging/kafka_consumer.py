from kafka import KafkaConsumer
from elasticsearch import Elasticsearch
import json

# Kafka consumer setup
consumer = KafkaConsumer(
    "logs",
    bootstrap_servers=["localhost:9092"],
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    group_id="logging-service",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

# Elasticsearch setup
es = Elasticsearch(["http://localhost:9200"])

# Consume messages from Kafka and store in Elasticsearch
for message in consumer:
    log_entry = message.value
    es.index(index="logs", body=log_entry)
    print(f"Log stored in Elasticsearch: {log_entry}")