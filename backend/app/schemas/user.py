from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import timedelta, date, datetime
from enum import Enum

from .base import BaseSchema
from ..models.user import User as UserModel

class UserBase(BaseSchema):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    due_date: date
    babies: int = 1
    pre_pregnancy_weight: Optional[float] = None
    height: Optional[float] = None  # in cm
    current_weight: Optional[float] = None  # in kg
    blood_type: Optional[str] = None
    allergies: List[str] = []
    conditions: List[str] = []
    dietary_preferences: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    due_date: Optional[date] = None
    babies: Optional[int] = None
    pre_pregnancy_weight: Optional[float] = None
    height: Optional[float] = None
    current_weight: Optional[float] = None
    blood_type: Optional[str] = None
    allergies: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    dietary_preferences: Optional[str] = None

class UserInDB(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class UserLogin(BaseSchema):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: Optional[str]
    last_name: Optional[str]
    due_date: date
    babies: int
    pre_pregnancy_weight: Optional[float]
    height: Optional[float]
    current_weight: Optional[float]
    trimester: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

    @classmethod
    def from_orm(cls, user: UserModel):
        today = date.today()
        # Calculate weeks pregnant based on due date
        conception_date = user.due_date - timedelta(weeks=40)
        weeks_pregnant = (today - conception_date).days // 7
        trimester = min(3, max(1, (weeks_pregnant // 13) + 1))
    
        return cls(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            due_date=user.due_date,
            babies=user.babies,
            pre_pregnancy_weight=user.pre_pregnancy_weight,
            height=user.height,
            current_weight=user.current_weight,
            trimester=trimester,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

