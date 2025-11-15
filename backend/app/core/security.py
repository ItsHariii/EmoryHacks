from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import status, HTTPException

from .config import settings
from .logging import logger
from ..models.user import User as UserModel

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
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
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Ensure we have a subject claim
    subject = str(data.get("sub"))  # This should be the user ID
    if not subject:
        raise ValueError("Token must have a 'sub' (subject) claim")
    
    # Set the standard claims
    to_encode.update({
        "exp": expire,
        "sub": subject,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    # Remove None values to avoid serialization issues
    to_encode = {k: v for k, v in to_encode.items() if v is not None}
    
    # Get the secret key value from SecretStr
    secret_key = settings.SECRET_KEY.get_secret_value()
    
    encoded_jwt = jwt.encode(
        to_encode, 
        secret_key,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a JWT token and return the payload if valid."""
    try:
        # Get the secret key value from SecretStr
        secret_key = settings.SECRET_KEY.get_secret_value()
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}", exc_info=True)
        return None

def get_current_user(
    token: str,
    db = None
):
    """Get the current user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify and decode the token
        payload = verify_token(token)
        if not payload:
            logger.error("Invalid token: Verification failed")
            raise credentials_exception
            
        # Extract user ID from subject claim
        user_id = payload.get("sub")
        if not user_id:
            logger.error("Token missing 'sub' claim")
            raise credentials_exception
            
        # Get database session if not provided
        if db is None:
            from .database import SessionScoped
            db = SessionScoped()
            
        # Get user from database
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            logger.error(f"User not found for ID: {user_id}")
            raise credentials_exception
            
        # Verify token type if present
        token_type = payload.get("type")
        if token_type and token_type != "access":
            logger.error(f"Invalid token type: {token_type}")
            raise credentials_exception
            
        return user
        
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}", exc_info=True)
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
