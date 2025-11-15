import sqlalchemy as sa
from sqlalchemy import Column, String, Float, Text, DateTime, Boolean, func, ARRAY, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
from enum import Enum as PyEnum
import uuid

from app.core.database import Base


class PregnancySafety(str, PyEnum):
    SAFE = "safe"
    LIMITED = "limited"
    AVOID = "avoid"


class IngredientSource(str, PyEnum):
    SPOONACULAR = "spoonacular"
    USDA = "usda"
    MANUAL = "manual"


class Ingredient(Base):
    """Ingredient model representing atomic-level ingredients."""
    __tablename__ = 'ingredients'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False, index=True)
    description = Column(Text, nullable=True)
    spoonacular_id = Column(BigInteger, nullable=True, index=True)
    fdc_id = Column(BigInteger, nullable=True, index=True)
    category = Column(Text, nullable=True, index=True)
    
    # Nutrition per 100g
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    fiber = Column(Float, nullable=True)
    sugar = Column(Float, nullable=True)
    
    # Detailed nutrition data
    micronutrients = Column(JSONB, nullable=False, default={})
    
    # Add sodium column to match database
    sodium = Column(Float, nullable=True)
    
    # Safety and allergen information
    allergens = Column(ARRAY(Text), nullable=True, default=[])
    safety_status = Column(String, nullable=True)  # Match database column name
    safety_notes = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)  # Match database column
    
    # Metadata
    source = Column(
        sa.Enum(IngredientSource),
        nullable=False,
        default=IngredientSource.MANUAL
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Ingredient {self.name}>"

    @classmethod
    def from_spoonacular_data(cls, spoon_data: dict):
        """Create an Ingredient from Spoonacular ingredient data."""
        ingredient = cls()
        ingredient.name = spoon_data.get('name', 'Unknown')
        ingredient.description = spoon_data.get('original', '')
        ingredient.spoonacular_id = spoon_data.get('id')
        ingredient.source = IngredientSource.SPOONACULAR
        
        # Extract pregnancy safety info if available
        pregnancy_safety = spoon_data.get('pregnancy_safety', {})
        if pregnancy_safety:
            ingredient.safety_status = pregnancy_safety.get('status', 'limited')
            ingredient.safety_notes = pregnancy_safety.get('notes', 'Safety status not determined')
        
        # Extract category from categoryPath
        category_path = spoon_data.get('categoryPath', [])
        if category_path:
            ingredient.category = category_path[-1]  # Use the most specific category
        
        # Extract nutrition data
        nutrition = spoon_data.get('nutrition', {})
        micronutrients = nutrition.get('micronutrients', [])
        
        detailed_micronutrients = {}
        for nutrient in micronutrients:
            name = nutrient.get('name', '').lower()
            amount = nutrient.get('amount', 0)
            unit = nutrient.get('unit', '')
            
            # Store detailed nutrient data
            nutrient_key = name.replace(' ', '_')
            detailed_micronutrients[nutrient_key] = {
                'amount': amount,
                'unit': unit,
                'percent_daily_needs': nutrient.get('percentOfDailyNeeds')
            }
            
            # Map to main nutrition fields
            if 'calories' in name or 'energy' in name:
                ingredient.calories = amount
            elif 'protein' in name:
                ingredient.protein = amount
            elif 'carbohydrates' in name:
                ingredient.carbs = amount
            elif 'fat' in name and 'saturated' not in name:
                ingredient.fat = amount
            elif 'fiber' in name:
                ingredient.fiber = amount
            elif 'sugar' in name:
                ingredient.sugar = amount
        
        ingredient.micronutrients = detailed_micronutrients
        return ingredient

    @classmethod
    def from_usda_data(cls, usda_data: dict):
        """Create an Ingredient from USDA FDC data."""
        ingredient = cls()
        ingredient.name = usda_data.get('description', 'Unknown').lower()
        ingredient.fdc_id = usda_data.get('fdcId')
        ingredient.source = IngredientSource.USDA
        ingredient.category = usda_data.get('foodCategory', '')
        
        # USDA doesn't provide safety info, so we'll set defaults that will be updated by safety service
        ingredient.safety_status = 'limited'  # Default to limited for manual review
        ingredient.safety_notes = 'Safety status pending review - defaulted to limited'
        
        # Process micronutrients
        detailed_micronutrients = {}
        for nutrient_data in usda_data.get('foodNutrients', []):
            nutrient_info = nutrient_data.get('nutrient', {})
            name = nutrient_info.get('name', '').lower()
            amount = nutrient_data.get('amount', 0)
            unit = nutrient_info.get('unitName', '')
            
            if not name or amount is None:
                continue
            
            # Store detailed nutrient data
            nutrient_key = name.replace(' ', '_')
            detailed_micronutrients[nutrient_key] = {
                'amount': amount,
                'unit': unit
            }
            
            # Map to main nutrition fields
            if 'protein' in name:
                ingredient.protein = amount
            elif 'carbohydrate' in name and 'total' in name:
                ingredient.carbs = amount
            elif 'fat' in name and 'total' in name:
                ingredient.fat = amount
            elif 'fiber' in name and 'dietary' in name:
                ingredient.fiber = amount
            elif 'sugar' in name and 'total' in name:
                ingredient.sugar = amount
            elif 'energy' in name and unit.lower() == 'kcal':
                ingredient.calories = amount
        
        ingredient.micronutrients = detailed_micronutrients
        return ingredient
