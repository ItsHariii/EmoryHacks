"""User provisioning from Supabase identity claims.

Single source of truth for: lookup-by-supabase-id, link-by-email, and
auto-create-from-claims. All Supabase-driven user creation flows through
get_or_create_from_supabase_claims so we have one place to enforce
idempotency, conflict rules, and audit logging.
"""

from __future__ import annotations

import hashlib
from datetime import date, timedelta
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..core.logging import logger
from ..models.user import User as UserModel


def _email_hash(email: Optional[str]) -> str:
    """SHA-256 of lowercased email — for audit logs without leaking PII."""
    if not email:
        return "<none>"
    return hashlib.sha256(email.lower().encode()).hexdigest()[:16]


def _extract_names(user_meta: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
    """Pull first/last name from Supabase user_metadata. Best-effort: providers
    use different keys (Google: given_name/family_name, others: name)."""
    if not isinstance(user_meta, dict):
        return None, None

    first = user_meta.get("first_name") or user_meta.get("given_name")
    last = user_meta.get("last_name") or user_meta.get("family_name")

    if not first and not last:
        full_name = user_meta.get("name")
        if full_name:
            parts = str(full_name).split()
            if parts:
                first = parts[0]
                last = " ".join(parts[1:]) if len(parts) > 1 else None

    return first, last


def get_or_create_from_supabase_claims(
    db: Session,
    *,
    supabase_user_id: str,
    email: Optional[str],
    raw_payload: Dict[str, Any],
) -> UserModel:
    """Resolve a Supabase identity to a local User, creating one if needed.

    Order:
        1. Match by supabase_user_id (canonical link).
        2. Match by email — if found, link unless already linked elsewhere.
        3. Create a new local user.

    Raises HTTP 409 on linking conflicts (same email, different supabase id).
    """
    if not supabase_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase token missing subject claim",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.supabase_user_id == str(supabase_user_id))
        .first()
    )
    if user:
        logger.info(
            "auth.supabase.login",
            extra={
                "user_id": str(user.id),
                "provider": "supabase",
                "email_hash": _email_hash(email),
                "linked": True,
            },
        )
        return user

    if email:
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            if user.supabase_user_id and user.supabase_user_id != str(supabase_user_id):
                logger.warning(
                    "auth.supabase.link_conflict",
                    extra={
                        "user_id": str(user.id),
                        "email_hash": _email_hash(email),
                    },
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Account linking conflict. This email is already linked "
                        "to a different social-login identity."
                    ),
                )
            if not user.supabase_user_id:
                user.supabase_user_id = str(supabase_user_id)
                user.is_verified = True
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(
                    "auth.supabase.link_by_email",
                    extra={
                        "user_id": str(user.id),
                        "provider": "supabase",
                        "email_hash": _email_hash(email),
                    },
                )
            return user

    # Provision a new local user.
    user_meta = raw_payload.get("user_metadata") or {}
    first_name, last_name = _extract_names(user_meta if isinstance(user_meta, dict) else {})

    # due_date is required by schema today; default to ~9 months out.
    due_date = date.today() + timedelta(days=270)

    email_verified = bool(
        raw_payload.get("email_verified") or raw_payload.get("email_confirmed_at")
    )

    user = UserModel(
        email=email or f"{supabase_user_id}@supabase.local",
        password_hash=None,
        supabase_user_id=str(supabase_user_id),
        first_name=first_name,
        last_name=last_name,
        due_date=due_date,
        babies=1,
        is_verified=email_verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(
        "auth.supabase.provision",
        extra={
            "user_id": str(user.id),
            "provider": "supabase",
            "email_hash": _email_hash(email),
            "email_verified": email_verified,
        },
    )
    return user
