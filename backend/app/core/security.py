from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from passlib.context import CryptContext
from fastapi import status, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

from .config import settings
from .logging import logger
from ..models.user import User as UserModel

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify a password against a hash. Social-login users may have no local hash."""
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # Ensure we have a subject claim
    subject = str(data.get("sub"))  # This should be the user ID
    if not subject:
        raise ValueError("Token must have a 'sub' (subject) claim")

    now = datetime.utcnow()

    # Set the standard claims
    to_encode.update(
        {
            "exp": expire,
            "sub": subject,
            "iat": now,
            "type": "access",
            "aud": settings.TOKEN_AUDIENCE,
            "iss": settings.TOKEN_ISSUER,
        }
    )

    # Remove None values to avoid serialization issues
    to_encode = {k: v for k, v in to_encode.items() if v is not None}

    # Get the secret key value from SecretStr
    secret_key = settings.SECRET_KEY.get_secret_value()

    encoded_jwt = jwt.encode(
        to_encode,
        secret_key,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt

def create_refresh_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    subject = str(data.get("sub"))
    if not subject:
        raise ValueError("Token must have a 'sub' (subject) claim")

    now = datetime.utcnow()

    to_encode.update(
        {
            "exp": expire,
            "sub": subject,
            "iat": now,
            "type": "refresh",
            "aud": settings.TOKEN_AUDIENCE,
            "iss": settings.TOKEN_ISSUER,
        }
    )

    to_encode = {k: v for k, v in to_encode.items() if v is not None}

    secret_key = settings.SECRET_KEY.get_secret_value()

    encoded_jwt = jwt.encode(
        to_encode,
        secret_key,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_token(
    token: str,
    token_type: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Verify a JWT token and return the payload if valid."""
    try:
        # Get the secret key value from SecretStr
        secret_key = settings.SECRET_KEY.get_secret_value()
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[settings.ALGORITHM],
            audience=settings.TOKEN_AUDIENCE,
            issuer=settings.TOKEN_ISSUER,
        )

        if token_type and payload.get("type") != token_type:
            logger.error(
                f"Token type mismatch. Expected '{token_type}', got '{payload.get('type')}'"
            )
            return None

        return payload
    except ExpiredSignatureError as e:
        logger.warning(f"Token expired: {str(e)}", exc_info=True)
        return None
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}", exc_info=True)
        return None

from .database import get_db
from sqlalchemy.orm import Session


_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def verify_local_token(token: str, db: Session) -> Optional[UserModel]:
    """Resolve a legacy local JWT to a User. Returns None if the token is
    not a valid local access token. Gated by LEGACY_AUTH_ENABLED.
    """
    if not settings.LEGACY_AUTH_ENABLED:
        return None

    payload = verify_token(token, token_type="access")
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        logger.error("Legacy token missing 'sub' claim")
        return None

    import uuid

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        logger.error(f"Invalid UUID format for legacy user_id: {user_id}")
        return None

    user = db.query(UserModel).filter(UserModel.id == user_uuid).first()
    if not user:
        logger.error(f"Legacy user not found for ID: {user_id}")
        return None

    logger.info(
        "auth.legacy.login",
        extra={"user_id": str(user.id), "provider": "legacy"},
    )
    return user


def verify_supabase_token(token: str, db: Session) -> Optional[UserModel]:
    """Resolve a Supabase JWT to a local User, provisioning if needed.
    Returns None when the token cannot be verified.
    """
    from .supabase_jwt import verify_supabase_access_token, extract_supabase_identity
    from ..services.user_provisioning import get_or_create_from_supabase_claims

    supa_payload = verify_supabase_access_token(token)
    if not supa_payload:
        return None

    supabase_user_id, email, raw = extract_supabase_identity(supa_payload)
    if not supabase_user_id:
        logger.error("Supabase token missing 'sub' claim")
        return None

    return get_or_create_from_supabase_claims(
        db,
        supabase_user_id=str(supabase_user_id),
        email=email,
        raw_payload=raw,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> UserModel:
    """FastAPI dependency: resolve the bearer token to a User."""
    from app.middleware.metrics import metrics_collector

    try:
        user = verify_local_token(token, db)
        if user:
            metrics_collector.record_auth("legacy", "success")
            return user

        user = verify_supabase_token(token, db)
        if user:
            metrics_collector.record_auth("supabase", "success")
            return user

        logger.warning("auth.token.invalid")
        metrics_collector.record_auth("unknown", "failure")
        raise _CREDENTIALS_EXCEPTION
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {e}", exc_info=True)
        metrics_collector.record_auth("unknown", "error")
        raise _CREDENTIALS_EXCEPTION from e

def generate_password_reset_token(email: str) -> str:
    """Generate a password reset token."""
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    
    # Get the secret key value from SecretStr
    secret_key = settings.SECRET_KEY.get_secret_value()
    
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        secret_key,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token and return the email if valid."""
    try:
        # Get the secret key value from SecretStr
        secret_key = settings.SECRET_KEY.get_secret_value()
        decoded_token = jwt.decode(
            token, secret_key, algorithms=[settings.ALGORITHM]
        )
        return decoded_token["sub"]
    except JWTError:
        return None
