"""
Journal and mood tracking endpoints.
Handles CRUD operations for journal entries.
"""
import logging
from datetime import datetime, date as date_type
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.journal import JournalEntry
from app.models.chat import ChatLog
from app.services.wellness_chatbot_service import wellness_chatbot_service
from app.schemas.journal import (
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
    JournalEntryListResponse,
    ChatRequest,
    ChatResponse,
    ChatSaveRequest,
    ChatSaveResponse,
    ChatHistoryResponse,
    ExtractedJournalData
)

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    entry_in: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new journal entry for the current user.
    """
    try:
        # Check if an entry already exists for this user and date
        existing_entry = db.query(JournalEntry).filter(
            and_(
                JournalEntry.user_id == current_user.id,
                JournalEntry.entry_date == entry_in.entry_date
            )
        ).first()
        
        if existing_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Journal entry already exists for {entry_in.entry_date}. Use PUT to update."
            )
        
        # Create new journal entry
        journal_entry = JournalEntry(
            user_id=current_user.id,
            entry_date=entry_in.entry_date,
            symptoms=entry_in.symptoms or [],
            mood=entry_in.mood,
            cravings=entry_in.cravings,
            sleep_quality=entry_in.sleep_quality,
            energy_level=entry_in.energy_level,
            notes=entry_in.notes
        )
        
        db.add(journal_entry)
        db.commit()
        db.refresh(journal_entry)
        
        logger.info(f"Created journal entry {journal_entry.id} for user {current_user.id}")
        return journal_entry
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating journal entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create journal entry"
        )


@router.get("/entries", response_model=JournalEntryListResponse)
async def get_journal_entries(
    start_date: Optional[date_type] = Query(None, description="Filter entries from this date (inclusive)"),
    end_date: Optional[date_type] = Query(None, description="Filter entries until this date (inclusive)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get journal entries for the current user.
    Can filter by date range and supports pagination.
    Returns entries in reverse chronological order (newest first).
    """
    try:
        # Build query
        query = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id)
        
        # Apply date filters
        if start_date:
            query = query.filter(JournalEntry.entry_date >= start_date)
        if end_date:
            query = query.filter(JournalEntry.entry_date <= end_date)
        
        # Get total count before pagination
        total = query.count()
        
        # Apply ordering and pagination
        entries = query.order_by(JournalEntry.entry_date.desc()).offset(offset).limit(limit).all()
        
        logger.info(f"Retrieved {len(entries)} journal entries for user {current_user.id}")
        
        return JournalEntryListResponse(
            entries=entries,
            total=total
        )
        
    except Exception as e:
        logger.error(f"Error retrieving journal entries: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve journal entries"
        )


@router.get("/entries/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific journal entry by ID.
    Users can only access their own entries.
    """
    try:
        entry = db.query(JournalEntry).filter(
            and_(
                JournalEntry.id == entry_id,
                JournalEntry.user_id == current_user.id
            )
        ).first()
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found"
            )
        
        return entry
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving journal entry {entry_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve journal entry"
        )


@router.put("/entries/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: str,
    entry_in: JournalEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing journal entry.
    Users can only update their own entries.
    """
    try:
        # Find the entry
        entry = db.query(JournalEntry).filter(
            and_(
                JournalEntry.id == entry_id,
                JournalEntry.user_id == current_user.id
            )
        ).first()
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found"
            )
        
        # Update fields that were provided
        update_data = entry_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(entry, field, value)
        
        # Update the updated_at timestamp
        entry.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(entry)
        
        logger.info(f"Updated journal entry {entry_id} for user {current_user.id}")
        return entry
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating journal entry {entry_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update journal entry"
        )


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a journal entry.
    Users can only delete their own entries.
    """
    try:
        # Find the entry
        entry = db.query(JournalEntry).filter(
            and_(
                JournalEntry.id == entry_id,
                JournalEntry.user_id == current_user.id
            )
        ).first()
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found"
            )
        
        # Delete the entry
        db.delete(entry)
        db.commit()
        
        logger.info(f"Deleted journal entry {entry_id} for user {current_user.id}")
        return None
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting journal entry {entry_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete journal entry"
        )


# Wellness Chatbot Endpoints

@router.post("/chat", response_model=ChatResponse)
async def chat_with_wellness_bot(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with the wellness journal chatbot.
    
    This endpoint handles conversational wellness check-ins. It can:
    - Start a new conversation (action='start' or no message)
    - Continue an existing conversation (with message and history)
    - Extract and return structured data from the conversation
    
    The chatbot uses AI to engage users naturally and extract mood, symptoms, and notes.
    """
    try:
        # Prepare user context for personalized responses
        user_context = {
            "user_id": str(current_user.id),
            "email": current_user.email
        }
        
        # Add pregnancy-related context if available
        if hasattr(current_user, 'due_date') and current_user.due_date:
            user_context["due_date"] = str(current_user.due_date)
            
            # Calculate trimester if due date is available
            from datetime import datetime, timedelta
            today = datetime.now().date()
            due_date = current_user.due_date
            
            # Calculate weeks pregnant (40 weeks total pregnancy)
            days_until_due = (due_date - today).days
            weeks_pregnant = 40 - (days_until_due / 7)
            
            if weeks_pregnant > 0:
                if weeks_pregnant <= 13:
                    user_context["trimester"] = 1
                elif weeks_pregnant <= 27:
                    user_context["trimester"] = 2
                else:
                    user_context["trimester"] = 3
        
        # Get recent symptoms from last few entries for context
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.user_id == current_user.id
        ).order_by(JournalEntry.entry_date.desc()).limit(3).all()
        
        if recent_entries:
            all_symptoms = []
            for entry in recent_entries:
                if entry.symptoms:
                    all_symptoms.extend(entry.symptoms)
            # Get unique symptoms
            user_context["recent_symptoms"] = list(set(all_symptoms))[:5]
        
        # Convert conversation history to the format expected by the service
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
        
        # Handle different actions
        action = request.action or ("start" if not request.message else "continue")
        
        if action == "start" or (not request.message and not conversation_history):
            # Start a new conversation
            result = await wellness_chatbot_service.start_conversation(user_context)
        else:
            # Continue existing conversation
            result = await wellness_chatbot_service.continue_conversation(
                message=request.message,
                conversation_history=conversation_history,
                user_context=user_context
            )
        
        # Convert extracted data to schema format
        extracted_data_dict = result.get("extracted_data", {})
        extracted_data = ExtractedJournalData(
            mood=extracted_data_dict.get("mood"),
            symptoms=extracted_data_dict.get("symptoms", []),
            notes=extracted_data_dict.get("notes"),
            cravings=extracted_data_dict.get("cravings"),
            sleep_quality=extracted_data_dict.get("sleep_quality"),
            energy_level=extracted_data_dict.get("energy_level")
        )
        
        # Save user message if provided
        if request.message:
            user_log = ChatLog(
                user_id=current_user.id,
                role="user",
                content=request.message
            )
            db.add(user_log)
        
        # Build response
        response = ChatResponse(
            response=result.get("response", ""),
            extracted_data=extracted_data,
            is_complete=result.get("is_complete", False),
            ready_to_save=result.get("ready_to_save", False),
            summary=result.get("summary"),
            suggestions=result.get("suggestions"),
            conversation_started=result.get("conversation_started", False),
            fallback_to_form=result.get("fallback_to_form", False),
            error=result.get("error")
        )
        
        # Save assistant response
        if response.response:
            assistant_log = ChatLog(
                user_id=current_user.id,
                role="assistant",
                content=response.response
            )
            db.add(assistant_log)
            
        db.commit()
        
        logger.info(f"Chat interaction for user {current_user.id}: action={action}, complete={response.is_complete}")
        return response
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        # Return a graceful error response
        return ChatResponse(
            response="I'm having some trouble right now. Would you like to use the traditional journal form instead?",
            extracted_data=ExtractedJournalData(),
            fallback_to_form=True,
            error=str(e)
        )


@router.post("/chat/save", response_model=ChatSaveResponse, status_code=status.HTTP_201_CREATED)
async def save_chat_as_journal_entry(
    request: ChatSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a chat conversation as a journal entry.
    
    This endpoint extracts structured data from the conversation history
    and creates a journal entry using the existing journal logic.
    
    Returns the saved entry ID and a summary of what was captured.
    """
    try:
        # Convert conversation history to service format
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
        
        # Extract journal data from conversation
        extracted_data = await wellness_chatbot_service.extract_journal_data(conversation_history)
        
        # Validate that we have at least some data
        has_data = (
            extracted_data.get("mood") is not None or
            len(extracted_data.get("symptoms", [])) > 0 or
            (extracted_data.get("notes") and len(extracted_data.get("notes", "").strip()) > 0)
        )
        
        if not has_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No meaningful data found in conversation. Please share more about your day before saving."
            )
        
        # Use provided date or default to today
        entry_date = request.entry_date or date_type.today()
        
        # Check if an entry already exists for this date
        existing_entry = db.query(JournalEntry).filter(
            and_(
                JournalEntry.user_id == current_user.id,
                JournalEntry.entry_date == entry_date
            )
        ).first()
        
        if existing_entry:
            # Update existing entry instead of creating new one
            existing_entry.mood = extracted_data.get("mood") or existing_entry.mood
            
            # Merge symptoms (avoid duplicates)
            new_symptoms = extracted_data.get("symptoms", [])
            existing_symptoms = existing_entry.symptoms or []
            merged_symptoms = list(set(existing_symptoms + new_symptoms))
            existing_entry.symptoms = merged_symptoms
            
            # Append notes if new notes exist
            new_notes = extracted_data.get("notes", "").strip()
            if new_notes:
                if existing_entry.notes:
                    existing_entry.notes = f"{existing_entry.notes}\n\n{new_notes}"
                else:
                    existing_entry.notes = new_notes
            
            # Update other fields if provided
            if extracted_data.get("cravings"):
                existing_entry.cravings = extracted_data.get("cravings")
            if extracted_data.get("sleep_quality"):
                existing_entry.sleep_quality = extracted_data.get("sleep_quality")
            if extracted_data.get("energy_level"):
                existing_entry.energy_level = extracted_data.get("energy_level")
            
            existing_entry.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(existing_entry)
            
            journal_entry = existing_entry
            logger.info(f"Updated existing journal entry {journal_entry.id} from chat for user {current_user.id}")
        else:
            # Create new journal entry
            journal_entry = JournalEntry(
                user_id=current_user.id,
                entry_date=entry_date,
                mood=extracted_data.get("mood"),
                symptoms=extracted_data.get("symptoms", []),
                notes=extracted_data.get("notes"),
                cravings=extracted_data.get("cravings"),
                sleep_quality=extracted_data.get("sleep_quality"),
                energy_level=extracted_data.get("energy_level")
            )
            
            db.add(journal_entry)
            db.commit()
            db.refresh(journal_entry)
            
            logger.info(f"Created journal entry {journal_entry.id} from chat for user {current_user.id}")
        
        # Generate a summary of what was saved
        confirmation = await wellness_chatbot_service.confirm_extracted_data(extracted_data)
        summary = confirmation.get("summary", "Your wellness check-in has been saved.")
        
        # Return response
        return ChatSaveResponse(
            entry_id=journal_entry.id,
            summary=summary,
            entry=journal_entry
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving chat as journal entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save journal entry from conversation"
        )


@router.get("/chat/history/{entry_date}", response_model=ChatHistoryResponse)
async def get_chat_history(
    entry_date: date_type,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a journal entry as a conversational summary.
    
    This endpoint retrieves a journal entry for a specific date and
    converts it to a natural, conversational summary using AI.
    
    This allows users to review their past entries in a friendly,
    narrative format rather than raw data.
    """
    try:
        # Find the journal entry for this date
        entry = db.query(JournalEntry).filter(
            and_(
                JournalEntry.user_id == current_user.id,
                JournalEntry.entry_date == entry_date
            )
        ).first()
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No journal entry found for {entry_date}"
            )
        
        # Convert entry to dict for the service
        entry_dict = {
            "entry_date": entry.entry_date,
            "mood": entry.mood,
            "symptoms": entry.symptoms or [],
            "notes": entry.notes,
            "cravings": entry.cravings,
            "sleep_quality": entry.sleep_quality,
            "energy_level": entry.energy_level
        }
        
        # Generate conversational summary using AI
        summary = await wellness_chatbot_service.summarize_past_entry(entry_dict)
        
        logger.info(f"Retrieved chat history for user {current_user.id}, date {entry_date}")
        
        return ChatHistoryResponse(
            summary=summary,
            entry=entry
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving chat history for {entry_date}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve journal entry history"
        )
