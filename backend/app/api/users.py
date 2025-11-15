from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User as UserModel
from ..schemas.user import UserResponse, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user information.
    """
    return UserResponse.from_orm(current_user)

@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information.
    """
    # Update user fields
    for field, value in user_in.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete current user account.
    """
    db.delete(current_user)
    db.commit()
    return None

@router.get("/trimester", response_model=int)
async def get_trimester(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get current pregnancy trimester.
    """
    return current_user.trimester

@router.get("/nutrition-targets", response_model=dict)
async def get_nutrition_targets(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get daily nutrition targets based on trimester.
    """
    trimester = current_user.trimester
    
    # Base calorie needs (this is a simplified calculation)
    base_calories = 2000  # Base for average woman
    additional_calories = 0
    
    # Additional calories based on trimester
    if trimester == 1:
        additional_calories = 0
    elif trimester == 2:
        additional_calories = 340
    else:  # trimester 3
        additional_calories = 450
    
    # Adjust for multiple babies
    if current_user.babies > 1:
        additional_calories *= 1.5  # Rough estimate for twins+
    
    total_calories = base_calories + additional_calories
    
    # Macronutrient distribution (as percentage of total calories)
    protein_pct = 0.25  # 25% of calories from protein
    carbs_pct = 0.45    # 45% of calories from carbs
    fat_pct = 0.30      # 30% of calories from fat
    
    # Convert percentages to grams (protein & carbs: 4 cal/g, fat: 9 cal/g)
    protein_g = (total_calories * protein_pct) / 4
    carbs_g = (total_calories * carbs_pct) / 4
    fat_g = (total_calories * fat_pct) / 9
    
    # Micronutrient targets (simplified)
    targets = {
        "calories": round(total_calories, 0),
        "macros": {
            "protein_g": round(protein_g, 1),
            "carbs_g": round(carbs_g, 1),
            "fat_g": round(fat_g, 1)
        },
        "micronutrients": {
            "fiber_g": 28,  # Increased for pregnancy
            "calcium_mg": 1000 + (200 if trimester > 1 else 0),  # Increased in 2nd/3rd trimester
            "iron_mg": 27,  # Increased for pregnancy
            "folate_mcg": 600,  # Increased for pregnancy
            "vitamin_d_mcg": 15,
            "vitamin_c_mg": 85,
            "vitamin_a_mcg": 770
        },
        "water_ml": 3000  # Increased water intake
    }
    
    return targets
