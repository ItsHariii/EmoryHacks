import pytest
from fastapi.testclient import TestClient
from datetime import date, timedelta

def test_create_journal_entry(client: TestClient, auth_headers: dict):
    today = date.today().isoformat()
    response = client.post(
        "/journal/entries",
        headers=auth_headers,
        json={
            "entry_date": today,
            "mood": 4,
            "symptoms": ["nausea", "fatigue"],
            "notes": "Feeling good today",
            "sleep_quality": 4,
            "energy_level": 3
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["entry_date"] == today
    assert data["mood"] == 4
    assert "nausea" in data["symptoms"]

def test_get_journal_entries(client: TestClient, auth_headers: dict):
    # Ensure at least one entry exists (from previous test or create new one)
    today = date.today().isoformat()
    # Check if entry exists, if not create one
    # But tests should be independent if possible. 
    # However, creating an entry for the same date twice fails.
    # So we should use a different date or handle 400.
    
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    client.post(
        "/journal/entries",
        headers=auth_headers,
        json={
            "entry_date": yesterday,
            "mood": 2,
            "symptoms": [],
            "notes": "Yesterday was okay"
        }
    )
    
    response = client.get("/journal/entries", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["entries"]) >= 1
    assert data["total"] >= 1

def test_get_journal_entry_by_id(client: TestClient, auth_headers: dict):
    # Create an entry
    entry_date = (date.today() - timedelta(days=2)).isoformat()
    create_response = client.post(
        "/journal/entries",
        headers=auth_headers,
        json={
            "entry_date": entry_date,
            "mood": 5,
            "notes": "Testing get by id"
        }
    )
    entry_id = create_response.json()["id"]
    
    response = client.get(f"/journal/entries/{entry_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == entry_id
    assert data["mood"] == 5

def test_update_journal_entry(client: TestClient, auth_headers: dict):
    # Create an entry
    entry_date = (date.today() - timedelta(days=3)).isoformat()
    create_response = client.post(
        "/journal/entries",
        headers=auth_headers,
        json={
            "entry_date": entry_date,
            "mood": 3,
            "notes": "Original note"
        }
    )
    entry_id = create_response.json()["id"]
    
    # Update it
    response = client.put(
        f"/journal/entries/{entry_id}",
        headers=auth_headers,
        json={
            "mood": 4,
            "notes": "Updated note"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mood"] == 4
    assert data["notes"] == "Updated note"

def test_delete_journal_entry(client: TestClient, auth_headers: dict):
    # Create an entry
    entry_date = (date.today() - timedelta(days=4)).isoformat()
    create_response = client.post(
        "/journal/entries",
        headers=auth_headers,
        json={
            "entry_date": entry_date,
            "mood": 1,
            "notes": "To be deleted"
        }
    )
    entry_id = create_response.json()["id"]
    
    # Delete it
    response = client.delete(f"/journal/entries/{entry_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/journal/entries/{entry_id}", headers=auth_headers)
    assert get_response.status_code == 404
