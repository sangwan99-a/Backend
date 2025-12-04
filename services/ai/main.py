from fastapi import FastAPI
from nlu_service import router as nlu_router
from contextual_reasoning_service import router as context_router
from predictive_analytics_service import router as predictive_router
from fastapi.openapi.utils import get_openapi

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "AI service is running"}

app.include_router(nlu_router, prefix="/api/ai")
app.include_router(context_router, prefix="/api/ai")
app.include_router(predictive_router, prefix="/api/ai")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="AI Microservices API",
        version="1.0.0",
        description="API documentation for AI microservices including NLU, Contextual Reasoning, and Predictive Analytics.",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi