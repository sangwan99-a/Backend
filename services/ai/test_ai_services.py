import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Test NLU Service
def test_nlu_analyze():
    response = client.post("/api/ai/nlu/analyze", json={"text": "Test input"})
    assert response.status_code == 200
    assert response.json()["message"] == "Text analyzed"

# Test Contextual Reasoning Service
def test_contextual_reasoning():
    response = client.post("/api/ai/context/reason", json={"context": "Test context"})
    assert response.status_code == 200
    assert response.json()["message"] == "Context processed"

# Test Predictive Analytics Service
def test_predictive_analytics():
    response = client.post("/api/ai/predict", json={"data": {"key": "value"}})
    assert response.status_code == 200
    assert response.json()["message"] == "Prediction complete"