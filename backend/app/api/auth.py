import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from ..core.database import get_db
from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    generate_password_reset_token,
    verify_password_reset_token,
)
from ..models.user import User as UserModel
from ..schemas.user import UserCreate, UserResponse, UserLogin, Token, LinkSupabaseRequest, LinkSupabaseResponse
from ..core.config import settings

router = APIRouter()

def _legacy_auth_guard():
    if not settings.LEGACY_AUTH_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Legacy email/password auth has been deprecated. Please sign in with Google/Apple.",
        )

@router.options("/register")
async def register_options():
    """Handle CORS preflight for register endpoint."""
    return {}

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    """
    _legacy_auth_guard()
    # Start a transaction
    try:
        # Check if user already exists
        db_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        from datetime import date, timedelta
        hashed_password = get_password_hash(user_in.password)
        
        # Set default due date to 9 months from now if not provided
        due_date = user_in.due_date if user_in.due_date else date.today() + timedelta(days=270)
        
        db_user = UserModel(
            email=user_in.email,
            password_hash=hashed_password,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            due_date=due_date,
            babies=user_in.babies,
            pre_pregnancy_weight=user_in.pre_pregnancy_weight,
            height=user_in.height,
            current_weight=user_in.current_weight,
            allergies=user_in.allergies,
            conditions=user_in.conditions,
            dietary_preferences=user_in.dietary_preferences,
            onboarding_completed=True,
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Convert to response model within the transaction
        response = UserResponse.from_orm(db_user)
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        db.rollback()
        raise
        
    except Exception as e:
        # Log the error and rollback the transaction
        db.rollback()
        logger = logging.getLogger(__name__)
        logger.error(f"Error during user registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration. Please try again."
        )

@router.options("/login")
async def login_options():
    """Handle CORS preflight for login endpoint."""
    return {}

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    _legacy_auth_guard()
    try:
        # Find user by email
        user = db.query(UserModel).filter(UserModel.email == form_data.username).first()
        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        
        # Create refresh token
        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are (like 401 Unauthorized)
        raise
        
    except Exception as e:
        logging.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """
    Refresh access token using a valid refresh token.
    """
    _legacy_auth_guard()
    from ..core.security import verify_token
    
    try:
        payload = verify_token(refresh_token, token_type="refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Verify user still exists
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        
        # Create new refresh token (rotate)
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Refresh token error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/verify-email")
async def verify_email(
    token: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Verify user email address.
    """
    # In a real implementation, you would verify the token against the one stored in DB
    # or verify the JWT signature if stateless
    
    # For now, we'll assume it's a simple token lookup
    user = db.query(UserModel).filter(UserModel.verification_token == token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
        
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user information.
    """
    return UserResponse.from_orm(current_user)

@router.options("/logout")
async def logout_options():
    """Handle CORS preflight for logout endpoint."""
    return {}

@router.post("/logout")
async def logout(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Logout user. Since we're using JWT tokens, the actual logout is handled
    client-side by removing the token. This endpoint validates the token
    and confirms the logout action.
    """
    return {"message": "Successfully logged out"}


@router.post("/link-supabase", response_model=LinkSupabaseResponse)
async def link_supabase_identity(
    payload: LinkSupabaseRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Link the currently authenticated local account to a Supabase Auth identity.

    Intended for migrations/merges: user signs in with legacy email/password, then
    completes a Supabase social login and sends the Supabase access token here.
    """
    from ..core.supabase_jwt import verify_supabase_access_token, extract_supabase_identity

    supa_payload = verify_supabase_access_token(payload.supabase_access_token)
    if not supa_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase access token",
        )

    supabase_user_id, email, _raw = extract_supabase_identity(supa_payload)
    if not supabase_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supabase token missing subject",
        )

    # For safety, require email match when we have both emails.
    if email and current_user.email and email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Supabase email does not match current account email",
        )

    # If another local user is already linked to this Supabase identity, block.
    existing = (
        db.query(UserModel)
        .filter(UserModel.supabase_user_id == str(supabase_user_id))
        .first()
    )
    if existing and existing.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Supabase identity is already linked to another account",
        )

    # If current user is already linked, ensure it's consistent.
    if current_user.supabase_user_id and current_user.supabase_user_id != str(supabase_user_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Current account is already linked to a different Supabase identity",
        )

    current_user.supabase_user_id = str(supabase_user_id)
    current_user.is_verified = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return LinkSupabaseResponse(linked=True, supabase_user_id=current_user.supabase_user_id)

@router.post("/password-recovery/{email}")
async def recover_password(email: str, db: Session = Depends(get_db)):
    """
    Password Recovery
    """
    _legacy_auth_guard()
    user = db.query(UserModel).filter(UserModel.email == email).first()
    
    if not user:
        # Don't reveal that the user doesn't exist
        return {"message": "If this email is registered, you will receive a password reset link."}
    
    # In a real app, send an email with the password reset link
    password_reset_token = generate_password_reset_token(email=email)
    
    # Mock email sending
    logger = logging.getLogger(__name__)
    logger.info(f"==================================================")
    logger.info(f"MOCK EMAIL TO: {email}")
    logger.info(f"SUBJECT: Password Recovery")
    logger.info(f"BODY: Click here to reset your password: {settings.API_PREFIX}/auth/reset-password?token={password_reset_token}")
    logger.info(f"==================================================")
    
    return {"message": "Password recovery email sent"}

@router.post("/reset-password/")
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(..., min_length=8),
    db: Session = Depends(get_db)
):
    """
    Reset password
    """
    _legacy_auth_guard()
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )
    
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    hashed_password = get_password_hash(new_password)
    user.password_hash = hashed_password
    db.commit()
    
    return {"message": "Password updated successfully"}