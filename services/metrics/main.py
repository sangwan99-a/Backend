from fastapi import FastAPI
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram, Gauge
from fastapi.responses import Response

app = FastAPI()

# Define Prometheus metrics
REQUEST_COUNT = Counter(
    "request_count", "Total number of requests", ["method", "endpoint"]
)
REQUEST_LATENCY = Histogram(
    "request_latency_seconds", "Request latency in seconds", ["endpoint"]
)

# Define custom metrics
BUSINESS_KPI = Gauge("business_kpi", "A custom business KPI")

@app.get("/health")
def health_check():
    return {"status": "Metrics service is running"}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/custom-metric")
def custom_metric():
    BUSINESS_KPI.set(42)  # Example value
    return {"status": "Custom metric updated", "value": 42}

@app.middleware("http")
async def prometheus_middleware(request, call_next):
    method = request.method
    endpoint = request.url.path
    REQUEST_COUNT.labels(method=method, endpoint=endpoint).inc()

    with REQUEST_LATENCY.labels(endpoint=endpoint).time():
        response = await call_next(request)

    return response