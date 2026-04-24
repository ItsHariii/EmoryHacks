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

def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Get the current user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1) Try legacy local JWT (current behavior)
        payload = verify_token(token, token_type="access")
        if payload:
            user_id = payload.get("sub")
            if not user_id:
                logger.error("Token missing 'sub' claim")
                raise credentials_exception

            import uuid

            try:
                user_uuid = uuid.UUID(user_id)
            except ValueError:
                logger.error(f"Invalid UUID format for user_id: {user_id}")
                raise credentials_exception

            user = db.query(UserModel).filter(UserModel.id == user_uuid).first()
            if not user:
                logger.error(f"User not found for ID: {user_id}")
                raise credentials_exception

            return user

        # 2) Try Supabase JWT (new behavior)
        from .supabase_jwt import verify_supabase_access_token, extract_supabase_identity
        supa_payload = verify_supabase_access_token(token)
        # Guard: both verification paths failed — reject the request.
        if not payload and not supa_payload:
            logger.error("Invalid token: legacy + Supabase verification both failed")
            raise credentials_exception
        if not supa_payload:
            logger.error("Invalid token: legacy + Supabase verification failed")
            raise credentials_exception

        supabase_user_id, email, raw = extract_supabase_identity(supa_payload)
        if not supabase_user_id:
            logger.error("Supabase token missing 'sub' claim")
            raise credentials_exception

        # Lookup by supabase_user_id first, then optionally link by email.
        user = (
            db.query(UserModel)
            .filter(UserModel.supabase_user_id == str(supabase_user_id))
            .first()
        )
        if not user and email:
            user = db.query(UserModel).filter(UserModel.email == email).first()
            if user:
                if user.supabase_user_id and user.supabase_user_id != str(supabase_user_id):
                    # Prevent accidental merges if the same email appears under a different Supabase identity.
                    logger.warning(
                        "Supabase linking conflict: email already linked to different Supabase user_id"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Account linking conflict. This email is already linked to a different social-login identity.",
                    )
                if not user.supabase_user_id:
                    user.supabase_user_id = str(supabase_user_id)
                    user.is_verified = True
                    db.add(user)
                    db.commit()
                    db.refresh(user)

        # Auto-provision local user if missing.
        if not user:
            from datetime import date, timedelta

            # Best-effort names from token metadata (provider-specific).
            user_meta = raw.get("user_metadata") or {}
            first_name = None
            last_name = None
            if isinstance(user_meta, dict):
                first_name = user_meta.get("first_name") or user_meta.get("given_name")
                last_name = user_meta.get("last_name") or user_meta.get("family_name")

            # Some providers put full name in "name"
            full_name = None
            if isinstance(user_meta, dict):
                full_name = user_meta.get("name")
            if full_name and (not first_name and not last_name):
                parts = str(full_name).split()
                if parts:
                    first_name = parts[0]
                    last_name = " ".join(parts[1:]) if len(parts) > 1 else None

            # due_date is required by schema today; default to ~9 months out.
            due_date = date.today() + timedelta(days=270)

            # Only mark verified if Supabase confirmed email verification
            email_verified = bool(raw.get("email_verified") or raw.get("email_confirmed_at"))

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

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}", exc_info=True)
        raise credentials_exception

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
