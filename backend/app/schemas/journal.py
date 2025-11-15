from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

from .base import BaseSchema


class JournalEntryBase(BaseSchema):
    """Base schema for journal entries"""
    entry_date: date
    symptoms: Optional[List[str]] = Field(default_factory=list)
    mood: Optional[int] = Field(None, ge=1, le=5, description="Mood rating from 1 (worst) to 5 (best)")
    cravings: Optional[str] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=5, description="Sleep quality from 1 (poor) to 5 (excellent)")
    energy_level: Optional[int] = Field(None, ge=1, le=5, description="Energy level from 1 (very low) to 5 (very high)")
    notes: Optional[str] = None

    @validator('mood', 'sleep_quality', 'energy_level')
    def validate_rating_range(cls, v):
        """Validate that ratings are within 1-5 range"""
        if v is not None and (v < 1 or v > 5):
            raise ValueError('Rating must be between 1 and 5')
        return v


class JournalEntryCreate(JournalEntryBase):
    """Schema for creating a new journal entry"""
    pass


class JournalEntryUpdate(BaseModel):
    """Schema for updating an existing journal entry"""
    entry_date: Optional[date] = None
    symptoms: Optional[List[str]] = None
    mood: Optional[int] = Field(None, ge=1, le=5)
    cravings: Optional[str] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

    @validator('mood', 'sleep_quality', 'energy_level')
    def validate_rating_range(cls, v):
        """Validate that ratings are within 1-5 range"""
        if v is not None and (v < 1 or v > 5):
            raise ValueError('Rating must be between 1 and 5')
        return v


class JournalEntryResponse(JournalEntryBase):
    """Schema for journal entry responses"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class JournalEntryListResponse(BaseSchema):
    """Schema for paginated list of journal entries"""
    entries: List[JournalEntryResponse]
    total: int
