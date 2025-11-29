"""
Food Nutrition Chatbot API endpoint.

Provides conversational AI assistance for pregnancy nutrition questions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.food_chatbot_service import food_chatbot_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatbotRequest(BaseModel):
    """Request model for chatbot questions."""
    question: str = Field(..., min_length=1, max_length=500, description="User's nutrition question")


class ChatbotResponse(BaseModel):
    """Response model for chatbot answers."""
    answer: str = Field(..., description="AI-generated answer")
    nutrition_data: Dict[str, Any] = Field(default_factory=dict, description="Nutrition data for mentioned foods")
    food_items: List[str] = Field(default_factory=list, description="Extracted food items")
    sources: List[str] = Field(default_factory=list, description="Data sources used")
    error: Optional[str] = Field(None, description="Error message if any")


@router.post("/chatbot", response_model=ChatbotResponse, status_code=status.HTTP_200_OK)
async def ask_nutrition_question(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask a pregnancy nutrition question to the AI chatbot.
    
    The chatbot will:
    1. Extract food items from your question
    2. Fetch nutrition data from USDA database
    3. Provide pregnancy-specific advice using AI
    
    Examples:
    - "Can I eat sushi during pregnancy?"
    - "How much protein do I need in my second trimester?"
    - "Is salmon safe to eat while pregnant?"
    - "What are good sources of iron?"
    """
    try:
        logger.info(f"Chatbot question from user {current_user.id}: {request.question}")
        
        # Prepare user context
        user_context = {
            "trimester": getattr(current_user, 'trimester', None),
            "user_id": str(current_user.id)
        }
        
        # Get response from chatbot service
        response = await food_chatbot_service.ask_question(
            question=request.question,
            user_context=user_context
        )
        
        logger.info(f"Chatbot response generated for user {current_user.id}")
        
        return ChatbotResponse(
            answer=response.get("answer", ""),
            nutrition_data=response.get("nutrition_data", {}),
            food_items=response.get("food_items", []),
            sources=response.get("sources", []),
            error=response.get("error")
        )
        
    except Exception as e:
        logger.error(f"Error in chatbot endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your question. Please try again."
        )
