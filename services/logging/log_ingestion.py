from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from kafka import KafkaProducer
import json

router = APIRouter()

# Kafka producer setup
producer = KafkaProducer(
    bootstrap_servers=["localhost:9092"],
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

class LogEntry(BaseModel):
    service: str
    level: str
    message: str
    timestamp: str

@router.post("/logs")
def ingest_log(log: LogEntry):
    try:
        # Send log to Kafka topic
        producer.send("logs", log.dict())
        return {"status": "Log ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest log: {str(e)}")