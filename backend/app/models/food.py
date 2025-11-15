import sqlalchemy as sa
from sqlalchemy import Column, String, Float, Enum as SQLEnum, ForeignKey, DateTime, Boolean, Text, func, ARRAY, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
import uuid

from app.core.database import Base


class FoodSafetyStatus(str, PyEnum):
    SAFE = "safe"
    LIMITED = "limited"
    AVOID = "avoid"


class FoodSource(str, PyEnum):
    SPOONACULAR = "spoonacular"
    USDA = "usda"
    LOCAL = "local"
    MANUAL = "manual"


class Food(Base):
    """Food model representing food items in the system."""
    __tablename__ = 'foods'
    __table_args__ = (
        # Unique constraint to prevent duplicate entries
        sa.UniqueConstraint('name', 'brand', 'serving_size', 'serving_unit', 
                          name='uq_food_unique'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    brand = Column(String(100), nullable=True, index=True)
    serving_size = Column(Float, nullable=False)
    serving_unit = Column(String(20), nullable=False)
    calories = Column(Float, nullable=False)
    
    # Macronutrients (for filtering/sorting)
    protein = Column(Float, nullable=False, server_default='0')
    carbs = Column(Float, nullable=False, server_default='0')
    fat = Column(Float, nullable=False, server_default='0')
    fiber = Column(Float, nullable=True)
    sugar = Column(Float, nullable=True)
    
    # Micronutrients and detailed data
    micronutrients = Column(JSONB, nullable=False, default={}, 
                          server_default='{}')  # Store full nutrient data as JSONB
    
    # Ingredients and allergens (for packaged foods)
    ingredients = Column(ARRAY(Text), nullable=True, default=[])  # Full list of ingredients
    allergens = Column(ARRAY(Text), nullable=True, default=[])   # Extracted allergen list
    
    # API Integration
    spoonacular_id = Column(BigInteger, nullable=True, index=True)
    fdc_id = Column(BigInteger, nullable=True, index=True)  # USDA FoodData Central ID
    
    # Safety Information
    safety_status = Column(
        SQLEnum('safe', 'limited', 'avoid', name='food_safety_status'),
        nullable=False,
        server_default='safe'
    )
    safety_notes = Column(Text, nullable=True)
    usda_confidence = Column(Float, nullable=True)  # Confidence score from USDA
    
    # Metadata
    source = Column(
        ENUM('spoonacular', 'usda', 'manual', name='foodsource'),
        nullable=False,
        server_default='manual'
    )
    is_verified = Column(Boolean, nullable=False, server_default='false')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), 
                      onupdate=func.now(), nullable=False)
    
    # Relationships
    # logs = relationship("FoodLog", back_populates="food")
    
    def __repr__(self):
        return f"<Food {self.name} ({self.brand or 'No Brand'})>"
    
    @classmethod
    def from_spoonacular_product_data(cls, product_data: dict):
        """Create a Food instance from Spoonacular product data."""
        food = cls()
        food.source = 'spoonacular'
        food.spoonacular_id = product_data.get('id')
        food.name = product_data.get('title', 'Unknown')
        food.description = product_data.get('generatedText', '')
        food.category = product_data.get('aisle', '')
        
        # Extract ingredients list
        ingredient_list = product_data.get('ingredientList', '')
        if ingredient_list:
            # Split ingredients by common separators
            ingredients = [ing.strip() for ing in ingredient_list.replace(',', ';').split(';')]
            food.ingredients = ingredients
        
        # Extract allergens from badges and ingredients
        allergens = []
        badges = product_data.get('badges', [])
        for badge in badges:
            if 'gluten' in badge.lower():
                allergens.append('gluten')
            elif 'dairy' in badge.lower() or 'milk' in badge.lower():
                allergens.append('dairy')
            elif 'soy' in badge.lower():
                allergens.append('soy')
            elif 'nut' in badge.lower():
                allergens.append('nuts')
        
        # Check ingredients for common allergens
        ingredient_text = ingredient_list.lower()
        common_allergens = {
            'milk': ['milk', 'dairy', 'lactose', 'casein', 'whey'],
            'eggs': ['egg', 'albumin'],
            'fish': ['fish', 'salmon', 'tuna', 'cod'],
            'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish'],
            'tree_nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio'],
            'peanuts': ['peanut'],
            'wheat': ['wheat', 'flour'],
            'soy': ['soy', 'soybean']
        }
        
        for allergen, keywords in common_allergens.items():
            if any(keyword in ingredient_text for keyword in keywords):
                if allergen not in allergens:
                    allergens.append(allergen)
        
        food.allergens = allergens
        
        # Extract nutrition data
        nutrition = product_data.get('nutrition', {})
        nutrients_list = nutrition.get('nutrients', [])
        
        detailed_nutrients = {}
        for nutrient in nutrients_list:
            name = nutrient.get('name', '').lower()
            amount = nutrient.get('amount', 0)
            unit = nutrient.get('unit', '')
            
            # Store detailed nutrient data
            nutrient_key = name.replace(' ', '_')
            detailed_nutrients[nutrient_key] = {
                'amount': amount,
                'unit': unit,
                'percent_daily_needs': nutrient.get('percentOfDailyNeeds')
            }
            
            # Map to main nutrition fields
            if 'calories' in name or 'energy' in name:
                food.calories = amount
            elif 'protein' in name:
                food.protein = amount
            elif 'carbohydrates' in name:
                food.carbs = amount
            elif 'fat' in name and 'saturated' not in name:
                food.fat = amount
            elif 'fiber' in name:
                food.fiber = amount
            elif 'sugar' in name:
                food.sugar = amount
        
        food.micronutrients = detailed_nutrients
        
        # Extract serving information
        servings = product_data.get('servings', {})
        food.serving_size = servings.get('size', 100)
        food.serving_unit = servings.get('unit', 'g')
        
        return food

    @classmethod
    def from_usda_data(cls, usda_data: dict, confidence: float = None):
        """
        Create a Food instance from USDA API data.
        
        Args:
            usda_data (dict): Raw USDA food data
            confidence (float, optional): Confidence score from USDA (0-1)
            
        Returns:
            Food: A new Food instance populated with USDA data
        """
        food = cls()
        food.source = 'usda'
        food.fdc_id = usda_data.get('fdcId')
        food.name = usda_data.get('description', 'Unknown').capitalize()
        food.brand = usda_data.get('brandOwner')
        food.category = usda_data.get('foodCategory')
        food.description = usda_data.get('ingredients', '')
        food.usda_confidence = confidence
        
        # Extract ingredients if available
        ingredients_text = usda_data.get('ingredients', '')
        if ingredients_text:
            ingredients = [ing.strip() for ing in ingredients_text.split(',')]
            food.ingredients = ingredients
        
        # Set serving information (default to 100g)
        food.serving_size = 100
        food.serving_unit = 'g'
        
        # Process nutrients
        nutrients = {}
        for nutrient in usda_data.get('foodNutrients', []):
            nutrient_info = nutrient.get('nutrient', {})
            nutrient_name = nutrient_info.get('name', '').lower()
            amount = nutrient.get('amount', 0)
            unit = nutrient_info.get('unitName', '')
            
            if not nutrient_name or amount is None:
                continue
                
            # Add to nutrients JSON
            nutrient_key = nutrient_name.replace(' ', '_')
            nutrients[nutrient_key] = {
                'amount': amount,
                'unit': unit,
                'percent_daily_value': nutrient.get('percentDailyValue')
            }
            
            # Set common nutrient fields
            if 'protein' in nutrient_name:
                food.protein = amount
            elif 'carbohydrate' in nutrient_name and 'total' in nutrient_name:
                food.carbs = amount
            elif 'fat' in nutrient_name and 'total' in nutrient_name:
                food.fat = amount
            elif 'fiber' in nutrient_name and 'dietary' in nutrient_name:
                food.fiber = amount
            elif 'sugar' in nutrient_name and 'total' in nutrient_name:
                food.sugar = amount
            elif 'energy' in nutrient_name and unit.lower() == 'kcal':
                food.calories = amount
        
        food.micronutrients = nutrients
        return food

    def __repr__(self):
        return f"<Food {self.name}>"


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    food_id = Column(UUID(as_uuid=True), ForeignKey("foods.id"), nullable=False, index=True)
    serving_size = Column(Float, nullable=False)  # User-specified serving size
    serving_unit = Column(String(20), nullable=False)  # User-specified serving unit
    quantity = Column(Float, nullable=False)
    consumed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    meal_type = Column(String)  # breakfast, lunch, dinner, snack
    notes = Column(String, nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support
    
    # Calculated nutrition fields
    calories_logged = Column(Float, nullable=False, default=0.0)  # Actual calories consumed
    nutrients_logged = Column(JSONB, nullable=True)  # Actual nutrients consumed
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), 
                      onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="food_logs")
    # food = relationship("Food", back_populates="logs")

    @property
    def trimester_at_consumption(self) -> int:
        """Calculate trimester at time of consumption based on user's due date."""
        if not self.user or not self.user.due_date:
            return 1  # Default to first trimester
        
        consumption_date = self.consumed_at.date()
        weeks_pregnant = (consumption_date - (self.user.due_date - timedelta(weeks=40))).days // 7
        
        if weeks_pregnant < 13:
            return 1
        elif 13 <= weeks_pregnant < 27:
            return 2
        return 3

    def __repr__(self):
        return f"<FoodLog user_id={self.user_id} food_id={self.food_id}>"
