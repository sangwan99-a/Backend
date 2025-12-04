from fastapi import FastAPI
from log_ingestion import router as log_router
from log_search import router as search_router

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "Logging service is running"}

app.include_router(log_router, prefix="/api/logging")
app.include_router(search_router, prefix="/api/logging")