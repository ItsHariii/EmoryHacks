import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User

def test_read_users_me(client: TestClient, test_user: User, auth_headers: dict):
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == str(test_user.id)

def test_update_user_profile(client: TestClient, test_user: User, auth_headers: dict):
    response = client.patch(
        "/users/me",
        headers=auth_headers,
        json={
            "first_name": "Updated",
            "current_weight": 70.5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["current_weight"] == 70.5

def test_get_trimester(client: TestClient, test_user: User, auth_headers: dict):
    response = client.get("/users/trimester", headers=auth_headers)
    assert response.status_code == 200
    # Based on due date set in conftest (180 days from now ~ 26 weeks pregnant -> Trimester 2)
    # 280 days total - 180 days remaining = 100 days pregnant (~14 weeks) -> Trimester 2
    assert isinstance(response.json(), int)
    assert 1 <= response.json() <= 3

def test_get_nutrition_targets(client: TestClient, test_user: User, auth_headers: dict):
    # Ensure user has weight/height for calculation
    test_user.pre_pregnancy_weight = 60
    test_user.height = 165
    
    response = client.get("/users/nutrition-targets", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "calories" in data
    assert "macros" in data
    assert "micronutrients" in data
    assert data["calories"] > 0

def test_delete_user(client: TestClient, test_user: User, auth_headers: dict, db_session: Session):
    response = client.delete("/users/me", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify user is deleted
    user = db_session.query(User).filter(User.id == test_user.id).first()
    assert user is None
