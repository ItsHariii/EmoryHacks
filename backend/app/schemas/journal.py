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

    model_config = {"from_attributes": True}


class JournalEntryListResponse(BaseSchema):
    """Schema for paginated list of journal entries"""
    entries: List[JournalEntryResponse]
    total: int


# Wellness Chatbot Schemas

class ChatMessage(BaseModel):
    """Schema for a single chat message"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Schema for chat endpoint request"""
    message: Optional[str] = Field(None, description="User's message (omit for conversation start)")
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Previous messages in conversation")
    action: Optional[str] = Field(None, description="Action: 'start', 'continue', or 'confirm'")


class ExtractedJournalData(BaseModel):
    """Schema for extracted journal data from conversation"""
    mood: Optional[int] = Field(None, ge=1, le=5)
    symptoms: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    cravings: Optional[str] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    energy_level: Optional[int] = Field(None, ge=1, le=5)


class ChatResponse(BaseModel):
    """Schema for chat endpoint response"""
    response: str = Field(..., description="Bot's response message")
    extracted_data: ExtractedJournalData = Field(default_factory=ExtractedJournalData, description="Data extracted from conversation")
    is_complete: Optional[bool] = Field(False, description="Whether conversation has enough data to save")
    ready_to_save: Optional[bool] = Field(False, description="Whether user can save the entry")
    summary: Optional[str] = Field(None, description="Summary of extracted data")
    suggestions: Optional[List[str]] = Field(None, description="Suggested responses for user")
    conversation_started: Optional[bool] = Field(False, description="Whether this is the start of a conversation")
    fallback_to_form: Optional[bool] = Field(False, description="Whether to fallback to traditional form")
    error: Optional[str] = Field(None, description="Error message if any")


class ChatSaveRequest(BaseModel):
    """Schema for saving conversation as journal entry"""
    conversation_history: List[ChatMessage] = Field(..., description="Complete conversation history")
    entry_date: Optional[date] = Field(None, description="Date for the entry (defaults to today)")


class ChatSaveResponse(BaseModel):
    """Schema for chat save response"""
    entry_id: UUID = Field(..., description="ID of created journal entry")
    summary: str = Field(..., description="Summary of saved entry")
    entry: JournalEntryResponse = Field(..., description="Complete saved entry")


class ChatHistoryResponse(BaseModel):
    """Schema for chat history response"""
    summary: str = Field(..., description="Conversational summary of the entry")
    entry: JournalEntryResponse = Field(..., description="Complete journal entry")
