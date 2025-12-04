from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from kafka import KafkaConsumer, KafkaProducer
import asyncio
import os
from transformers import pipeline

# FastAPI app setup
app = FastAPI()

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_token(token: str = Depends(oauth2_scheme)):
    # Logic to verify JWT token
    if token != os.getenv("JWT_SECRET", "supersecret"):
        raise HTTPException(status_code=401, detail="Invalid token")

# Kafka setup
producer = KafkaProducer(
    bootstrap_servers=os.getenv("KAFKA_BROKERS", "localhost:9092").split(","),
    value_serializer=lambda v: str(v).encode("utf-8"),
)
consumer = KafkaConsumer(
    "ai-assistant-events",
    bootstrap_servers=os.getenv("KAFKA_BROKERS", "localhost:9092").split(","),
    group_id="ai-assistant-group",
    value_deserializer=lambda v: v.decode("utf-8"),
)

# AI Model Integration
chatbot = pipeline("conversational")
summarizer = pipeline("summarization")

# Pydantic models
class ChatRequest(BaseModel):
    user_input: str

class EmailTriageRequest(BaseModel):
    email_content: str

class SummaryRequest(BaseModel):
    text: str

# RESTful API endpoints
@app.post("/chat")
async def chat(request: ChatRequest, token: str = Depends(verify_token)):
    """Endpoint for chatbot interactions."""
    response = chatbot(request.user_input)
    return {"response": response}

@app.post("/summarize")
async def summarize(request: SummaryRequest, token: str = Depends(verify_token)):
    """Endpoint to summarize text."""
    summary = summarizer(request.text, max_length=50, min_length=25, do_sample=False)
    return {"summary": summary}

@app.post("/email/triage")
async def email_triage(request: EmailTriageRequest, token: str = Depends(verify_token)):
    """Endpoint for smart email triage."""
    # Placeholder logic for email triage
    priority = "High" if "urgent" in request.email_content.lower() else "Low"
    return {"priority": priority}

# Kafka event consumption
async def consume_events():
    for message in consumer:
        event = message.value
        # Process consumed events
        print(f"Consumed event: {event}")

# Background task to consume Kafka events
@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.create_task(consume_events())

# Dockerized service startup
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)