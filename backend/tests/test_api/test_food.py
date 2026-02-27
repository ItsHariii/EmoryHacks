"""Tests for food endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestFood:
    """Test food endpoints."""

    @patch('app.api.food.search.search_external_apis')
    def test_search_foods_success(self, mock_search, client: TestClient, auth_headers):
        """Test successful food search."""
        mock_search.return_value = [
            {
                "id": "1", 
                "name": "Apple", 
                "image": "apple.jpg", 
                "source": "spoonacular",
                "serving_size": 100,
                "serving_unit": "g",
                "calories": 52,
                "safety_status": "safe"
            }
        ]
        
        response = client.get(
            "/food/search?query=apple&limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # The response is a list of results directly
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["name"] == "Apple"

    def test_search_foods_without_auth(self, client: TestClient):
        """Test food search without authentication."""
        response = client.get("/food/search?query=apple")
        assert response.status_code == 401

        # Debug: Check if food exists in DB
        from app.models.food import Food
        # We need to access the session. Since client uses override, we can use the same session if we had access to it.
        # But we don't have direct access to the session used by client inside the test unless we use the fixture.
        # The fixture 'db_session' is available if we request it.
        # But wait, 'test_food' fixture uses 'db_session'.
        # Let's request 'db_session' in the test function arguments.
        
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

    @patch('app.api.food.safety.pregnancy_safety_service.check_food_safety')
    def test_food_safety_check(self, mock_safety_check, client: TestClient, auth_headers):
        """Test food safety check endpoint."""
        mock_safety_check.return_value = (
            "safe",
            "Safe to eat",
            [{"name": "apple", "safety_status": "safe", "safety_notes": "Safe"}]
        )
        
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
            "serving_size": 100,
            "serving_unit": "g",
            "meal_type": "breakfast"
        }
        response = client.post(
            "/food/log",
            json=log_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["food_id"] == log_data["food_id"]
        assert data["quantity"] == 1.0  # Quantity is normalized to 1.0
        assert data["serving_size"] == log_data["serving_size"]
