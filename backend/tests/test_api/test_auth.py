"""Tests for authentication endpoints."""
import pytest
from fastapi.testclient import TestClient


class TestAuth:
    """Test authentication endpoints."""

    def test_login_success(self, client: TestClient, test_user):
        """Test successful login."""
        response = client.post(
            "/auth/login",
            data={"username": test_user.email, "password": "testpassword"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client: TestClient, test_user):
        """Test login with invalid credentials."""
        response = client.post(
            "/auth/login",
            data={"username": test_user.email, "password": "wrongpassword"}
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with nonexistent user."""
        response = client.post(
            "/auth/login",
            data={"username": "nonexistent@example.com", "password": "password"}
        )
        assert response.status_code == 401

    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User"
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["first_name"] == user_data["first_name"]
        assert "id" in data

    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,
            "password": "password123",
            "first_name": "Duplicate",
            "last_name": "User"
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400

    def test_protected_endpoint_without_token(self, client: TestClient):
        """Test accessing protected endpoint without token."""
        response = client.get("/users/me")
        assert response.status_code == 401

    def test_protected_endpoint_with_token(self, client: TestClient, auth_headers):
        """Test accessing protected endpoint with valid token."""
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "first_name" in data
