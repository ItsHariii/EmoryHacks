from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

from .base import BaseSchema

class FoodSafetyStatus(str, Enum):
    SAFE = "safe"
    LIMITED = "limited"
    AVOID = "avoid"

class NutrientBase(BaseModel):
    name: str
    amount: float
    unit: str
    percent_daily_value: Optional[float] = None

class FoodBase(BaseSchema):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    serving_size: float = Field(..., gt=0, description="Serving size in grams")
    serving_unit: str = Field(..., description="Unit of measurement (g, ml, oz, etc.)")
    calories: float = Field(..., ge=0, description="Calories per serving")
    nutrients: Dict[str, Dict[str, Any]] = Field(..., description="Nutrients in the food")
    safety_status: FoodSafetyStatus = FoodSafetyStatus.SAFE
    safety_notes: Optional[str] = None
    fdc_id: Optional[str] = Field(None, description="USDA FoodData Central ID")

class FoodCreate(FoodBase):
    pass

class FoodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    serving_size: Optional[float] = None
    serving_unit: Optional[str] = None
    calories: Optional[float] = None
    nutrients: Optional[Dict[str, Dict[str, Any]]] = None
    safety_status: Optional[FoodSafetyStatus] = None
    safety_notes: Optional[str] = None
    fdc_id: Optional[str] = None

class FoodResponse(FoodBase):
    id: str
    created_at: datetime
    updated_at: datetime

class FoodSearchResult(BaseSchema):
    id: str
    name: str
    brand: Optional[str] = None
    serving_size: Optional[float] = 100.0
    serving_unit: Optional[str] = "g"
    calories: Optional[float] = 0.0
    safety_status: FoodSafetyStatus = FoodSafetyStatus.LIMITED
    safety_notes: Optional[str] = None
    
    # Macronutrients
    protein: Optional[float] = 0.0
    carbs: Optional[float] = 0.0
    fat: Optional[float] = 0.0
    fiber: Optional[float] = 0.0
    sugar: Optional[float] = 0.0
    sodium: Optional[float] = 0.0
    
    # Micronutrients (detailed nutrition data)
    micronutrients: Optional[Dict[str, Any]] = {}
    
    # Source information
    source: Optional[str] = "manual"
    item_type: str = "food"  # "food" or "ingredient"

class FoodLogBase(BaseSchema):
    food_id: str
    serving_size: float = Field(..., gt=0, description="Amount consumed (e.g., 1.5)")
    serving_unit: str = Field(..., description="Unit of serving (e.g., 'cup', 'g', 'serving')")
    consumed_at: datetime = Field(default_factory=datetime.utcnow)
    meal_type: Optional[str] = Field(
        None, 
        description="Type of meal (breakfast, lunch, dinner, snack)",
        pattern="^(breakfast|lunch|dinner|snack)$"
    )
    notes: Optional[str] = None

class FoodLogCreate(FoodLogBase):
    pass

class FoodLogUpdate(BaseModel):
    serving_size: Optional[float] = None
    serving_unit: Optional[str] = None
    quantity: Optional[float] = None
    consumed_at: Optional[datetime] = None
    meal_type: Optional[str] = None
    notes: Optional[str] = None

class FoodLogResponse(FoodLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    food: FoodResponse
    
    # Computed fields for clarity
    total_amount: Optional[float] = None
    total_unit: Optional[str] = None
    
    # Calculated nutrition fields
    calories_logged: float = 0.0
    nutrients_logged: Optional[Dict[str, float]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DailyNutrition(BaseSchema):
    date: date
    total_calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    fiber_g: float = 0.0
    sugar_g: float = 0.0
    sodium_mg: float = 0.0
    calcium_mg: float = 0.0
    iron_mg: float = 0.0
    vitamin_a_mcg: float = 0.0
    vitamin_c_mg: float = 0.0
    vitamin_d_mcg: float = 0.0
    folate_mcg: float = 0.0
    
    def add_food(self, food: 'FoodResponse', quantity: float = 1.0):
        """Add nutrition information from a food item to the daily total"""
        multiplier = quantity * (food.serving_size / 100)  # Convert to 100g basis
        
        self.total_calories += food.calories * quantity
        
        # Map common nutrient names to our fields
        nutrient_map = {
            'protein': ('protein_g', 1),
            'total lipid (fat)': ('fat_g', 1),
            'carbohydrate, by difference': ('carbs_g', 1),
            'fiber, total dietary': ('fiber_g', 1),
            'sugars, total including NLEA': ('sugar_g', 1),
            'sodium, Na': ('sodium_mg', 1000),  # Convert g to mg
            'calcium, Ca': ('calcium_mg', 1000),  # Convert g to mg
            'iron, Fe': ('iron_mg', 1000),  # Convert g to mg
            'vitamin a, rae': ('vitamin_a_mcg', 1),
            'vitamin c, total ascorbic acid': ('vitamin_c_mg', 1),
            'vitamin d (d2 + d3)': ('vitamin_d_mcg', 1),
            'folate, total': ('folate_mcg', 1)
        }
        
        for nutrient_name, (field, multiplier) in nutrient_map.items():
            if nutrient_name in food.nutrients:
                nutrient = food.nutrients[nutrient_name]
                current_value = getattr(self, field, 0)
                setattr(self, field, current_value + (nutrient['amount'] * multiplier * quantity))
