"""Tests for food endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestFood:
    """Test food endpoints."""

    @patch('app.services.unified_food_service.unified_food_service.search_foods')
    def test_search_foods_success(self, mock_search, client: TestClient, auth_headers):
        """Test successful food search."""
        mock_search.return_value = {
            "results": [
                {"id": 1, "title": "Apple", "image": "apple.jpg"}
            ]
        }
        
        response = client.get(
            "/food/search?query=apple&limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)

    def test_search_foods_without_auth(self, client: TestClient):
        """Test food search without authentication."""
        response = client.get("/food/search?query=apple")
        assert response.status_code == 401

    def test_get_food_by_id(self, client: TestClient, auth_headers, test_food):
        """Test getting food by ID."""
        response = client.get(
            f"/food/{test_food.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_food.id)
        assert data["name"] == test_food.name

    def test_get_nonexistent_food(self, client: TestClient, auth_headers):
        """Test getting nonexistent food."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.get(
            f"/food/{fake_id}",
            headers=auth_headers
        )
        assert response.status_code == 404

    @patch('app.services.unified_food_service.unified_food_service.check_food_safety')
    def test_food_safety_check(self, mock_safety_check, client: TestClient, auth_headers):
        """Test food safety check endpoint."""
        mock_safety_check.return_value = {
            "query": "apple",
            "ingredients": [{"name": "apple", "safety_status": "safe"}],
            "overall_safety_status": "safe"
        }
        
        safety_request = {
            "query": "apple",
            "analyze_as_recipe": False
        }
        response = client.post(
            "/food/safety-check",
            json=safety_request,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "ingredients" in data
        assert "overall_safety_status" in data

    def test_log_food_consumption(self, client: TestClient, auth_headers, test_food):
        """Test logging food consumption."""
        log_data = {
            "food_id": str(test_food.id),
            "quantity": 1.5,
            "meal_type": "breakfast"
        }
        response = client.post(
            "/logs/food",
            json=log_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["food_id"] == log_data["food_id"]
        assert data["quantity"] == log_data["quantity"]
