from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

import requests
from jose import jwt
from jose.exceptions import JWTError
from jose.jwk import construct

from .config import settings
from .logging import logger


_JWKS_CACHE: Dict[str, Any] = {}
_JWKS_CACHE_EXPIRES_AT: float = 0.0


def _derive_supabase_jwks_url() -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    return (settings.SUPABASE_JWKS_URL or f"{base}/auth/v1/keys").rstrip("/")


def _derive_supabase_issuer() -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    # Supabase access tokens use this issuer.
    return (settings.SUPABASE_JWT_ISSUER or f"{base}/auth/v1").rstrip("/")


def _verify_hs256(token: str) -> Optional[Dict[str, Any]]:
    """Verify a Supabase HS256 access token using the project's JWT secret.

    This is the default path for Supabase projects whose current signing key
    is `Legacy HS256 (Shared Secret)`.
    """
    secret_obj = settings.SUPABASE_JWT_SECRET
    if not secret_obj:
        return None
    secret = secret_obj.get_secret_value()
    if not secret:
        return None

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=_derive_supabase_issuer(),
        )
        return payload
    except JWTError as e:
        logger.info(f"Supabase HS256 verification failed: {e}")
        return None


def _get_jwks() -> Dict[str, Any]:
    """Fetch (and cache) the Supabase project's JWKS.

    Supabase's `/auth/v1/keys` endpoint requires the project's anon `apikey`
    header — without it, the endpoint returns 401.
    """
    global _JWKS_CACHE, _JWKS_CACHE_EXPIRES_AT

    now = time.time()
    if _JWKS_CACHE and now < _JWKS_CACHE_EXPIRES_AT:
        return _JWKS_CACHE

    jwks_url = _derive_supabase_jwks_url()
    anon_key = settings.SUPABASE_KEY.get_secret_value() if settings.SUPABASE_KEY else ""
    headers = {}
    if anon_key:
        headers["apikey"] = anon_key
        headers["Authorization"] = f"Bearer {anon_key}"

    resp = requests.get(jwks_url, headers=headers, timeout=5)
    resp.raise_for_status()
    jwks = resp.json()
    if not isinstance(jwks, dict) or "keys" not in jwks:
        raise ValueError("JWKS response missing 'keys'")

    _JWKS_CACHE = jwks
    _JWKS_CACHE_EXPIRES_AT = now + 60 * 10  # 10 minutes
    return jwks


def _verify_asymmetric(token: str) -> Optional[Dict[str, Any]]:
    """Verify a Supabase asymmetric (RS256/ES256) token via JWKS.

    Used when the project has enabled asymmetric JWT Keys. Safe to call for
    HS256 tokens too — it just returns None because the kid won't match.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        alg = unverified_header.get("alg")

        if not kid or alg == "HS256":
            # No kid, or symmetric token — JWKS path doesn't apply.
            return None

        try:
            jwks = _get_jwks()
        except Exception as e:
            logger.info(f"JWKS unavailable (expected for HS256-only projects): {e}")
            return None

        keys = jwks.get("keys", [])
        key_dict = next((k for k in keys if k.get("kid") == kid), None)
        if not key_dict:
            logger.info("Supabase token kid not in JWKS")
            return None

        public_key = construct(key_dict)
        payload = jwt.decode(
            token,
            public_key.to_pem(),
            algorithms=[key_dict.get("alg", alg or "RS256")],
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=_derive_supabase_issuer(),
        )
        return payload
    except JWTError as e:
        logger.info(f"Supabase asymmetric JWT verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected Supabase asymmetric verification error: {e}", exc_info=True)
        return None


def verify_supabase_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a Supabase Auth access token.

    Strategy:
    1. HS256 with SUPABASE_JWT_SECRET (default Supabase signing mode).
    2. Asymmetric (RS256 / ES256) via JWKS, for projects that have rotated
       to asymmetric JWT Keys. Uses the anon `apikey` header on the JWKS
       request, since Supabase's `/auth/v1/keys` endpoint requires it.

    Required claim checks: signature, iss (project issuer), aud (default
    `authenticated`), exp (jose handles it).
    """
    payload = _verify_hs256(token)
    if payload:
        return payload

    return _verify_asymmetric(token)


def extract_supabase_identity(payload: Dict[str, Any]) -> Tuple[Optional[str], Optional[str], Dict[str, Any]]:
    """
    Returns (supabase_user_id, email, raw_payload).
    """
    supabase_user_id = payload.get("sub")

    email = payload.get("email")
    if not email:
        # Some tokens store it under user_metadata; keep best-effort.
        user_meta = payload.get("user_metadata") or {}
        if isinstance(user_meta, dict):
            email = user_meta.get("email")

    return supabase_user_id, email, payload
