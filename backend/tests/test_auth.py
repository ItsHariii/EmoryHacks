import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password

def test_register_user(client: TestClient, db_session: Session):
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123",
            "first_name": "New",
            "last_name": "User",
            "due_date": "2025-01-01"
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    
    # Verify user in DB
    user = db_session.query(User).filter(User.email == "newuser@example.com").first()
    assert user is not None
    assert verify_password("Password123", user.password_hash)

def test_register_existing_email(client: TestClient, test_user: User):
    response = client.post(
        "/auth/register",
        json={
            "email": test_user.email,
            "password": "Password123",
            "first_name": "Duplicate",
            "last_name": "User",
            "due_date": "2025-01-01"
        },
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_login_success(client: TestClient, test_user: User):
    response = client.post(
        "/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client: TestClient, test_user: User):
    response = client.post(
        "/auth/login",
        data={
            "username": test_user.email,
            "password": "wrongpassword"
        },
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_password_recovery(client: TestClient, test_user: User):
    response = client.post(f"/auth/password-recovery/{test_user.email}")
    assert response.status_code == 200
    assert "Password recovery email sent" in response.json()["message"]

def test_password_recovery_invalid_email(client: TestClient):
    response = client.post("/auth/password-recovery/nonexistent@example.com")
    # Should return 200 to avoid enumerating users
    assert response.status_code == 200
