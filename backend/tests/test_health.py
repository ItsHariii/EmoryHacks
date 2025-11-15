"""Tests for health check endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestHealth:
    """Test health check endpoints."""

    def test_basic_health_check(self, client: TestClient):
        """Test basic health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_readiness_check(self, client: TestClient):
        """Test readiness check endpoint."""
        response = client.get("/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"

    def test_liveness_check(self, client: TestClient):
        """Test liveness check endpoint."""
        response = client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"

    def test_detailed_health_check(self, client: TestClient):
        """Test detailed health check endpoint exists."""
        response = client.get("/health/detailed")
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404

    def test_metrics_endpoint(self, client: TestClient):
        """Test metrics endpoint exists."""
        response = client.get("/metrics")
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404
