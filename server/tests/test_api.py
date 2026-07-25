import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from datetime import datetime

# Import FastAPI app and dependencies
from app.main import app, get_db

client = TestClient(app)

# Helper to generate dummy database mock
class MockDatabase:
    def __init__(self):
        self.users = MagicMock()
        self.patients = MagicMock()

# Setup mocks
mock_db = MockDatabase()

def override_get_db():
    return mock_db

# Override the get_db dependency injection in FastAPI app
app.dependency_overrides[get_db] = override_get_db

def test_read_root():
    """Verify that root endpoint responds successfully with online status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "PerioTwin" in data["app"]

def test_auth_login_validation():
    """Verify login validation rejects empty payload and invalid credentials format."""
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422 # Unprocessable Entity

def test_forecast_simulation_endpoint():
    """Verify that forecast simulation performs sequence projections accurately."""
    payload = {
        "smoking": True,
        "diabetes": True,
        "hba1c": 7.5,
        "plaque_index": 45.0,
        "bleeding_on_probing": 35.0,
        "current_bone_loss": 2.5,
        "current_attachment_loss": 3.0
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Assert return structure
    assert "risk_category" in data
    assert "risk_probability" in data
    assert "trajectory" in data
    
    # Validate trajectory points (Month 0, 6, 12)
    trajectory = data["trajectory"]
    assert len(trajectory) == 3
    assert trajectory[0]["month"] == 0
    assert trajectory[1]["month"] == 6
    assert trajectory[2]["month"] == 12
    
    # Verify progression increases values over time
    assert trajectory[2]["bone_loss"] >= trajectory[0]["bone_loss"]
    assert trajectory[2]["attachment_loss"] >= trajectory[0]["attachment_loss"]

def test_auth_signup_duplicate_error():
    """Verify registration raises HTTP 400 when email is already registered."""
    # Mock database to return existing user
    async_mock_find = AsyncMock(return_value={"_id": ObjectId(), "email": "test@dentist.com"})
    mock_db.users.find_one = async_mock_find

    payload = {
        "email": "test@dentist.com",
        "password": "securepassword123",
        "name": "Dr. Dentist"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]
