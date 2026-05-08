"""Food-logging route ordering tests.

Pinned to keep the regression where `/food/log/summary` and
`/food/log/weekly-summary` got matched as `/food/log/{log_id}` before
the route order was fixed (Phase 1.2).
"""
from __future__ import annotations

import pytest


def test_summary_route_resolves_with_no_logs(client, auth_headers, db_session, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LEGACY_AUTH_ENABLED", True)
    response = client.get("/food/log/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "total_calories" in body


def test_weekly_summary_route_resolves(client, auth_headers, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LEGACY_AUTH_ENABLED", True)
    response = client.get("/food/log/weekly-summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body.get("total_days") == 7
    assert "daily_summaries" in body


def test_log_id_route_returns_404_for_missing_uuid(client, auth_headers, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LEGACY_AUTH_ENABLED", True)
    response = client.get(
        "/food/log/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404
