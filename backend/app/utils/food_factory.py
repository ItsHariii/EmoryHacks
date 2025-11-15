"""
Food and Ingredient creation utilities.

This module handles the creation and caching of Food and Ingredient objects
from various data sources (Spoonacular, USDA, manual input).
"""

import logging
import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models.food import Food, FoodSource, FoodSafetyStatus
from ..models.ingredient import Ingredient, IngredientSource, PregnancySafety
from ..services.pregnancy_safety_service import pregnancy_safety_service
from ..services.usda_service import usda_service

logger = logging.getLogger(__name__)


class FoodFactory:
    """Factory class for creating Food and Ingredient objects from various sources."""
    
    @staticmethod
    def parse_spoonacular_nutrients(nutrients: List[dict]) -> dict:
        """Parse Spoonacular nutrients list into a structured dictionary."""
        parsed = {}
        
        for nutrient in nutrients:
            name = nutrient.get("name", "").lower()
            amount = nutrient.get("amount", 0)
            unit = nutrient.get("unit", "")
            percent_dv = nutrient.get("percentOfDailyNeeds")
            
            # Standardize nutrient names and store with metadata
            parsed[name] = {
                "amount": amount,
                "unit": unit,
                "percent_daily_value": percent_dv
            }
        
        return parsed
    
    @staticmethod
    async def create_food_from_spoonacular(
        db: Session,
        spoonacular_data: dict,
        spoonacular_id: str,
        safety_status: str = "safe",
        safety_notes: str = ""
    ) -> Optional[Food]:
        """
        Create a Food object from Spoonacular product data.
        
        Args:
            db: Database session
            spoonacular_data: Raw Spoonacular product data
            spoonacular_id: Spoonacular product ID
            safety_status: Pregnancy safety status
            safety_notes: Safety notes
            
        Returns:
            Created Food object or None if creation failed
        """
        try:
            # Extract basic information
            name = spoonacular_data.get("title", "Unknown Food").strip()
            brand = spoonacular_data.get("brand", "").strip() or None
            
            # Extract nutrition data
            nutrition = spoonacular_data.get("nutrition", {})
            nutrients = nutrition.get("nutrients", [])
            
            # Parse nutrients
            parsed_nutrients = FoodFactory.parse_spoonacular_nutrients(nutrients)
            
            # Extract macronutrients with defaults
            calories = next((n.get("amount", 0) for n in nutrients if "calorie" in n.get("name", "").lower()), 0)
            protein = next((n.get("amount", 0) for n in nutrients if "protein" in n.get("name", "").lower()), 0)
            carbs = next((n.get("amount", 0) for n in nutrients if "carbohydrate" in n.get("name", "").lower()), 0)
            fat = next((n.get("amount", 0) for n in nutrients if "fat" in n.get("name", "").lower() and "saturated" not in n.get("name", "").lower()), 0)
            fiber = next((n.get("amount") for n in nutrients if "fiber" in n.get("name", "").lower()), None)
            sugar = next((n.get("amount") for n in nutrients if "sugar" in n.get("name", "").lower()), None)
            
            # Create Food object
            new_food = Food(
                name=name,
                brand=brand,
                serving_size=1.0,
                serving_unit="serving",
                calories=calories,
                protein=protein,
                carbs=carbs,
                fat=fat,
                fiber=fiber,
                sugar=sugar,
                micronutrients=parsed_nutrients,
                safety_status=safety_status,
                safety_notes=safety_notes,
                spoonacular_id=spoonacular_id,
                source=FoodSource.SPOONACULAR,
                is_verified=True
            )
            
            db.add(new_food)
            db.commit()
            db.refresh(new_food)
            
            logger.info(f"Created Spoonacular food: {name}")
            return new_food
            
        except Exception as e:
            logger.error(f"Error creating food from Spoonacular data: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    async def create_ingredient_from_spoonacular(
        db: Session,
        ingredient_name: str,
        spoonacular_data: dict = None
    ) -> Optional[Ingredient]:
        """
        Create an Ingredient object from Spoonacular data.
        
        Args:
            db: Database session
            ingredient_name: Name of the ingredient
            spoonacular_data: Optional Spoonacular ingredient data
            
        Returns:
            Created Ingredient object or None if creation failed
        """
        try:
            # Create new ingredient with nutrition data
            new_ingredient = Ingredient(
                name=ingredient_name.strip().lower(),
                source=IngredientSource.SPOONACULAR if spoonacular_data else IngredientSource.MANUAL
            )
            
            # Extract nutrition data from Spoonacular response if available
            if spoonacular_data:
                nutrients = spoonacular_data.get("nutrition", {}).get("nutrients", [])
                
                # Extract key nutrients
                for nutrient in nutrients:
                    name = nutrient.get("name", "").lower()
                    amount = nutrient.get("amount", 0)
                    
                    if "calorie" in name:
                        new_ingredient.calories = amount
                    elif "protein" in name:
                        new_ingredient.protein = amount
                    elif "carbohydrate" in name:
                        new_ingredient.carbs = amount
                    elif "fat" in name and "saturated" not in name:
                        new_ingredient.fat = amount
                    elif "fiber" in name:
                        new_ingredient.fiber = amount
                    elif "sugar" in name:
                        new_ingredient.sugar = amount
                    elif "sodium" in name:
                        new_ingredient.sodium = amount
                
                # Store full nutrient data
                new_ingredient.micronutrients = FoodFactory.parse_spoonacular_nutrients(nutrients)
                new_ingredient.spoonacular_id = spoonacular_data.get("id")
            
            # Get pregnancy safety information
            safety_info = pregnancy_safety_service.get_safety_status(ingredient_name)
            new_ingredient.safety_status = safety_info["status"]
            new_ingredient.safety_notes = safety_info["notes"]
            
            db.add(new_ingredient)
            db.commit()
            db.refresh(new_ingredient)
            
            logger.info(f"Created ingredient: {ingredient_name}")
            return new_ingredient
            
        except IntegrityError:
            db.rollback()
            # Ingredient might already exist, try to fetch it
            existing = db.query(Ingredient).filter(
                Ingredient.name == ingredient_name.strip().lower()
            ).first()
            if existing:
                logger.info(f"Ingredient already exists: {ingredient_name}")
                return existing
            logger.error(f"Failed to create ingredient due to integrity error: {ingredient_name}")
            return None
        except Exception as e:
            logger.error(f"Error creating ingredient {ingredient_name}: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    async def create_ingredient_from_usda(
        db: Session,
        fdc_id: str
    ) -> Optional[Ingredient]:
        """
        Create an Ingredient object from USDA data.
        
        Args:
            db: Database session
            fdc_id: USDA Food Data Central ID
            
        Returns:
            Created Ingredient object or None if creation failed
        """
        try:
            # Check if ingredient already exists by FDC ID
            existing = db.query(Ingredient).filter(Ingredient.fdc_id == fdc_id).first()
            if existing:
                return existing
            
            # Fetch USDA data
            usda_data = await usda_service.get_food_details(fdc_id)
            if not usda_data:
                return None
            
            # Extract basic info
            basic_info = usda_service.extract_basic_info(usda_data)
            nutrients = usda_service.parse_nutrients(usda_data)
            
            # Create unique name to avoid conflicts (include FDC ID if name already exists)
            base_name = basic_info["name"].lower()
            existing_name = db.query(Ingredient).filter(Ingredient.name == base_name).first()
            if existing_name:
                # If name exists, make it unique by including description or FDC ID
                if basic_info["description"]:
                    unique_name = f"{base_name}, {basic_info['description'][:50].lower()}"
                else:
                    unique_name = f"{base_name} (fdc:{fdc_id})"
            else:
                unique_name = base_name
            
            # Create ingredient
            new_ingredient = Ingredient(
                name=unique_name,
                description=basic_info["description"],
                fdc_id=int(fdc_id),
                category=basic_info["category"],
                calories=nutrients.get("calories", {}).get("amount", 0),
                protein=nutrients.get("protein", {}).get("amount", 0),
                carbs=nutrients.get("carbs", {}).get("amount", 0),
                fat=nutrients.get("fat", {}).get("amount", 0),
                fiber=nutrients.get("fiber", {}).get("amount"),
                sugar=nutrients.get("sugar", {}).get("amount"),
                sodium=nutrients.get("sodium", {}).get("amount", 0),
                micronutrients=json.dumps(nutrients) if nutrients else "{}",
                source=IngredientSource.USDA
            )
            
            # Apply pregnancy safety status
            safety_info = pregnancy_safety_service.get_safety_status(basic_info["name"])
            new_ingredient.safety_status = safety_info["status"]
            new_ingredient.safety_notes = safety_info["notes"]
            
            db.add(new_ingredient)
            db.commit()
            db.refresh(new_ingredient)
            
            logger.info(f"Created USDA ingredient: {unique_name}")
            return new_ingredient
            
        except IntegrityError as e:
            logger.error(f"Integrity error creating USDA ingredient {fdc_id}: {str(e)}")
            db.rollback()
            # Try to find existing ingredient by name as fallback
            try:
                existing = db.query(Ingredient).filter(Ingredient.name.ilike(f"%{basic_info['name']}%")).first()
                return existing
            except:
                return None
        except Exception as e:
            logger.error(f"Error creating USDA ingredient {fdc_id}: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    async def create_food_from_usda(
        db: Session,
        fdc_id: str
    ) -> Optional[Food]:
        """
        Create a Food object from USDA data.
        
        Args:
            db: Database session
            fdc_id: USDA Food Data Central ID
            
        Returns:
            Created Food object or None if creation failed
        """
        try:
            # Check if food already exists
            existing = db.query(Food).filter(Food.fdc_id == fdc_id).first()
            if existing:
                return existing
            
            # Fetch USDA data
            usda_data = await usda_service.get_food_details(fdc_id)
            if not usda_data:
                return None
            
            # Extract basic info and nutrients
            basic_info = usda_service.extract_basic_info(usda_data)
            nutrients = usda_service.parse_nutrients(usda_data)
            
            # Create food
            new_food = Food(
                name=basic_info["name"],
                description=basic_info["description"],
                brand=basic_info["brand"],
                serving_size=basic_info["serving_size"],
                serving_unit=basic_info["serving_unit"],
                calories=nutrients.get("calories", {}).get("amount"),
                protein=nutrients.get("protein", {}).get("amount", 0),
                carbs=nutrients.get("carbs", {}).get("amount", 0),
                fat=nutrients.get("fat", {}).get("amount", 0),
                fiber=nutrients.get("fiber", {}).get("amount"),
                sugar=nutrients.get("sugar", {}).get("amount"),
                micronutrients=nutrients,
                ingredients=basic_info["ingredients"],
                fdc_id=int(fdc_id),
                source=FoodSource.USDA
            )
            
            # Apply pregnancy safety status
            safety_info = pregnancy_safety_service.get_safety_status(basic_info["name"])
            new_food.safety_status = safety_info["status"]
            new_food.safety_notes = safety_info["notes"]
            
            db.add(new_food)
            db.commit()
            db.refresh(new_food)
            
            logger.info(f"Created USDA food: {basic_info['name']}")
            return new_food
            
        except Exception as e:
            logger.error(f"Error creating USDA food {fdc_id}: {str(e)}")
            db.rollback()
            return None


# Create singleton instance
food_factory = FoodFactory()
