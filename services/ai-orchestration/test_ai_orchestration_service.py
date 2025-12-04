from fastapi.testclient import TestClient
from ai_orchestration_service import app

client = TestClient(app)

def test_create_workflow():
    response = client.post("/ai/workflows", json={"workflow_id": "test1", "description": "Test workflow"})
    assert response.status_code == 200
    assert response.json() == {"message": "Workflow created successfully.", "workflow_id": "test1"}

def test_create_duplicate_workflow():
    client.post("/ai/workflows", json={"workflow_id": "test1", "description": "Test workflow"})
    response = client.post("/ai/workflows", json={"workflow_id": "test1", "description": "Duplicate workflow"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Workflow already exists."

def test_get_workflow_status():
    client.post("/ai/workflows", json={"workflow_id": "test2", "description": "Another test workflow"})
    response = client.get("/ai/workflows/test2")
    assert response.status_code == 200
    assert response.json()["status"] == "created"

def test_trigger_workflow():
    client.post("/ai/workflows", json={"workflow_id": "test3", "description": "Workflow to trigger"})
    response = client.post("/ai/workflows/test3/trigger")
    assert response.status_code == 200
    assert response.json() == {"message": "Workflow triggered successfully.", "workflow_id": "test3"}
    status_response = client.get("/ai/workflows/test3")
    assert status_response.json()["status"] == "running"}