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
from app.schemas.journal import (
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
    JournalEntryListResponse
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
