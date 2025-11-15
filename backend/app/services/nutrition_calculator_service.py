"""
Nutrition Calculator Service

Handles nutrient scaling calculations for food logging.
Converts base nutritional data to actual consumed amounts based on serving size and quantity.
"""
from typing import Dict, Any, Optional
import logging
from ..models.food import Food

logger = logging.getLogger(__name__)


class NutritionCalculatorService:
    """Service for calculating actual nutrition consumed based on serving size and quantity."""
    
    # Unit conversion factors to grams
    UNIT_CONVERSIONS = {
        'g': 1.0,
        'gram': 1.0,
        'grams': 1.0,
        'ml': 1.0,  # Assume 1ml = 1g for most foods
        'milliliter': 1.0,
        'milliliters': 1.0,
        'serving': None,  # Will use food's base serving size
        'servings': None,
        'cup': 240.0,  # Standard cup = 240ml/g
        'cups': 240.0,
        'tbsp': 15.0,  # Tablespoon = 15ml/g
        'tablespoon': 15.0,
        'tablespoons': 15.0,
        'tsp': 5.0,  # Teaspoon = 5ml/g
        'teaspoon': 5.0,
        'teaspoons': 5.0,
        'oz': 28.35,  # Ounce = 28.35g
        'ounce': 28.35,
        'ounces': 28.35,
        'lb': 453.59,  # Pound = 453.59g
        'pound': 453.59,
        'pounds': 453.59,
    }
    
    def normalize_serving_info(self, food: Food, user_serving_size: Optional[float], user_serving_unit: Optional[str]) -> tuple[float, str]:
        """
        Normalize serving information, defaulting to food's base serving if not provided.
        
        Args:
            food: The food item from database
            user_serving_size: User-provided serving size (optional)
            user_serving_unit: User-provided serving unit (optional)
            
        Returns:
            Tuple of (normalized_serving_size, normalized_serving_unit)
        """
        if user_serving_size is None or user_serving_unit is None:
            # Default to food's base serving
            return food.serving_size, food.serving_unit
        
        # Normalize unit to lowercase for consistency
        normalized_unit = user_serving_unit.lower().strip()
        
        return user_serving_size, normalized_unit
    
    def convert_to_base_units(self, serving_size: float, serving_unit: str, food: Food) -> float:
        """
        Convert serving size to base units (grams) for calculation.
        
        Args:
            serving_size: Size of serving
            serving_unit: Unit of serving
            food: Food item for reference
            
        Returns:
            Serving size in base units (grams)
        """
        unit_lower = serving_unit.lower().strip()
        
        # Handle 'serving' unit specially
        if unit_lower in ['serving', 'servings']:
            return serving_size * food.serving_size
        
        # Convert other units to grams
        conversion_factor = self.UNIT_CONVERSIONS.get(unit_lower, 1.0)
        return serving_size * conversion_factor
    
    def calculate_nutrition_multiplier(self, food: Food, user_serving_size: float, user_serving_unit: str, quantity: float) -> float:
        """
        Calculate the multiplier for scaling nutrition data.
        
        Args:
            food: Food item from database
            user_serving_size: User's serving size
            user_serving_unit: User's serving unit
            quantity: Number of servings consumed
            
        Returns:
            Multiplier for scaling nutrition data
        """
        # Convert user serving to base units (grams)
        user_serving_grams = self.convert_to_base_units(user_serving_size, user_serving_unit, food)
        
        # Food nutrition is typically per 100g or per serving
        # Convert food's base serving to grams for comparison
        food_base_grams = food.serving_size
        if food.serving_unit.lower() not in ['g', 'gram', 'grams']:
            food_base_grams = self.convert_to_base_units(food.serving_size, food.serving_unit, food)
        
        # Avoid division by zero
        if food_base_grams == 0:
            logger.error(f"Food base grams is 0 for food {food.name}, using 100g as default")
            food_base_grams = 100.0
        
        # Calculate multiplier: (user_serving_grams / food_base_grams) * quantity
        multiplier = (user_serving_grams / food_base_grams) * quantity
        
        logger.info(f"Nutrition calculation: user_serving_grams={user_serving_grams}, food_base_grams={food_base_grams}, quantity={quantity}, multiplier={multiplier}")
        
        return multiplier
    
    def calculate_consumed_nutrition(self, food: Food, user_serving_size: Optional[float], 
                                   user_serving_unit: Optional[str], quantity: float) -> Dict[str, Any]:
        """
        Calculate actual nutrition consumed based on serving size and quantity.
        
        Args:
            food: Food item from database
            user_serving_size: User-provided serving size (optional)
            user_serving_unit: User-provided serving unit (optional)
            quantity: Number of servings consumed
            
        Returns:
            Dictionary containing calculated nutrition values
        """
        try:
            # Normalize serving information
            serving_size, serving_unit = self.normalize_serving_info(food, user_serving_size, user_serving_unit)
            
            # Calculate nutrition multiplier
            multiplier = self.calculate_nutrition_multiplier(food, serving_size, serving_unit, quantity)
            
            # Calculate consumed calories (rounded to 1 decimal place)
            calories_logged = round((food.calories or 0) * multiplier, 1)
            
            # Calculate consumed macronutrients with null safety
            nutrients_logged = {
                'protein': round((food.protein or 0) * multiplier, 1),
                'carbs': round((food.carbs or 0) * multiplier, 1),
                'fat': round((food.fat or 0) * multiplier, 1),
                'fiber': round((food.fiber or 0) * multiplier, 1),
                'sugar': round((food.sugar or 0) * multiplier, 1),
            }
            
            # Add micronutrients if available
            if food.micronutrients:
                for nutrient_name, nutrient_data in food.micronutrients.items():
                    if isinstance(nutrient_data, dict) and 'amount' in nutrient_data:
                        nutrients_logged[nutrient_name] = round(nutrient_data['amount'] * multiplier, 1)
            
            logger.info(f"Calculated nutrition for {food.name}: {calories_logged} calories, multiplier: {multiplier}")
            
            return {
                'calories_logged': calories_logged,
                'nutrients_logged': nutrients_logged,
                'serving_size_used': serving_size,
                'serving_unit_used': serving_unit,
                'multiplier': multiplier
            }
            
        except Exception as e:
            import traceback
            logger.error(f"Error calculating nutrition for food {getattr(food, 'id', 'unknown')}: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            # Return safe defaults
            return {
                'calories_logged': 0.0,
                'nutrients_logged': {
                    'protein': 0.0,
                    'carbs': 0.0,
                    'fat': 0.0,
                    'fiber': 0.0,
                    'sugar': 0.0,
                },
                'serving_size_used': getattr(food, 'serving_size', 100.0),
                'serving_unit_used': getattr(food, 'serving_unit', 'g'),
                'multiplier': 0.0
            }


# Global service instance
nutrition_calculator_service = NutritionCalculatorService()
