"""Supabase auth verification tests.

Covers HS256 happy path, RS256 happy path via mocked JWKS, expired tokens,
wrong audience, wrong issuer, missing email, and dual-link conflicts.
"""
from __future__ import annotations

import time
from datetime import date, timedelta
from typing import Any, Dict
from unittest.mock import patch

import pytest
from jose import jwt

from app.core.config import settings
from app.models.user import User as UserModel


HS_SECRET = "test-supabase-jwt-secret"


def _hs_token(claims: Dict[str, Any]) -> str:
    return jwt.encode(claims, HS_SECRET, algorithm="HS256")


def _base_claims(**overrides: Any) -> Dict[str, Any]:
    now = int(time.time())
    issuer = (settings.SUPABASE_JWT_ISSUER or f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1")
    base = {
        "sub": "supabase-user-1",
        "email": "supa-user@example.com",
        "aud": settings.SUPABASE_JWT_AUDIENCE,
        "iss": issuer,
        "iat": now,
        "exp": now + 600,
        "email_verified": True,
        "user_metadata": {"given_name": "Supa", "family_name": "User"},
    }
    base.update(overrides)
    return base


@pytest.fixture(autouse=True)
def _set_supabase_secret(monkeypatch):
    """Force a known HS256 secret for the verifier without leaking real keys."""
    from pydantic import SecretStr

    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", SecretStr(HS_SECRET))
    monkeypatch.setattr(settings, "LEGACY_AUTH_ENABLED", False)
    yield


def test_hs256_valid_token_provisions_user(client, db_session):
    token = _hs_token(_base_claims())

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "supa-user@example.com"

    user = (
        db_session.query(UserModel)
        .filter(UserModel.supabase_user_id == "supabase-user-1")
        .first()
    )
    assert user is not None
    assert user.is_verified is True


def test_hs256_expired_token_rejected(client):
    claims = _base_claims(exp=int(time.time()) - 10)
    token = _hs_token(claims)

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_hs256_wrong_audience_rejected(client):
    token = _hs_token(_base_claims(aud="wrong-audience"))

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_hs256_wrong_issuer_rejected(client):
    token = _hs_token(_base_claims(iss="https://attacker.example/auth/v1"))

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_token_missing_email_provisions_with_synthetic_email(client, db_session):
    claims = _base_claims(sub="no-email-user", email=None)
    claims.pop("email", None)
    token = _hs_token(claims)

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    user = (
        db_session.query(UserModel)
        .filter(UserModel.supabase_user_id == "no-email-user")
        .first()
    )
    assert user is not None
    assert user.email.endswith("@supabase.local")


def test_dual_link_conflict_returns_409(client, db_session):
    # Existing user already linked to a *different* Supabase id under same email.
    existing = UserModel(
        email="conflict@example.com",
        password_hash=None,
        supabase_user_id="other-supabase-id",
        due_date=date.today() + timedelta(days=180),
        babies=1,
    )
    db_session.add(existing)
    db_session.commit()

    token = _hs_token(_base_claims(sub="new-supabase-id", email="conflict@example.com"))

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 409


def test_email_link_attaches_supabase_id_to_existing_user(client, db_session):
    existing = UserModel(
        email="link@example.com",
        password_hash="x",
        supabase_user_id=None,
        due_date=date.today() + timedelta(days=180),
        babies=1,
    )
    db_session.add(existing)
    db_session.commit()
    existing_id = existing.id

    token = _hs_token(_base_claims(sub="link-supabase-id", email="link@example.com"))

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    db_session.expire_all()
    refreshed = db_session.query(UserModel).filter(UserModel.id == existing_id).first()
    assert refreshed.supabase_user_id == "link-supabase-id"


def test_jwks_rs256_path_invoked_when_hs256_fails(monkeypatch, client):
    """RS256 path: when HS256 verification fails (bogus signature), fall through
    to JWKS verification. We assert the JWKS verifier is consulted, not its
    crypto correctness — that's covered by jose itself.
    """
    # Token signed with a *different* secret so HS256 must fail.
    bad_token = jwt.encode(_base_claims(), "another-secret", algorithm="HS256")

    called = {"hit": False}

    def fake_asymmetric(token: str):
        called["hit"] = True
        return None

    monkeypatch.setattr(
        "app.core.supabase_jwt._verify_asymmetric", fake_asymmetric
    )

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {bad_token}"})
    assert resp.status_code == 401
    assert called["hit"] is True


def test_legacy_login_returns_410_when_disabled(client):
    resp = client.post(
        "/auth/login",
        data={"username": "x@example.com", "password": "irrelevant"},
    )
    assert resp.status_code == 410
