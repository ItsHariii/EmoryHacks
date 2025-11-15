from pydantic import BaseModel, EmailStr, Field, validator
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4

class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }

class Token(BaseSchema):
    access_token: str
    token_type: str

class TokenData(BaseSchema):
    email: Optional[str] = None
    user_id: Optional[UUID] = None

class Message(BaseSchema):
    detail: str

class HealthCheck(BaseSchema):
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
