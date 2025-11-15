import json
import logging
import os
from typing import Dict, List, Tuple, Optional
from enum import Enum
from ..models.food import FoodSafetyStatus

logger = logging.getLogger(__name__)

class PregnancySafetyLevel(Enum):
    SAFE = "safe"
    LIMITED = "limited"
    AVOID = "avoid"
    UNKNOWN = "unknown"

class PregnancySafetyService:
    """
    Service for determining pregnancy safety of foods and ingredients.
    Loads safety rules from JSON file and provides fallback defaults.
    """
    
    def __init__(self):
        self.safety_rules = {}
        self._load_safety_rules()
    
    def _load_safety_rules(self):
        """Load pregnancy safety rules from JSON file."""
        try:
            # Get the path to the JSON file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, '..', 'data', 'pregnancy_safety_rules.json')
            
            with open(json_path, 'r') as f:
                self.safety_rules = json.load(f)
            
            logger.info(f"Loaded {len(self.safety_rules)} pregnancy safety rules")
        except Exception as e:
            logger.error(f"Failed to load pregnancy safety rules: {e}")
            # Fallback to empty dict - will use defaults
            self.safety_rules = {}
    
    def get_safety_status(self, ingredient_name: str) -> Dict[str, str]:
        """
        Get safety status for an ingredient.
        
        Args:
            ingredient_name: Name of the ingredient
            
        Returns:
            Dict with 'status' and 'notes' keys
        """
        ingredient_key = ingredient_name.lower().strip()
        
        # Direct lookup in safety rules
        if ingredient_key in self.safety_rules:
            rule = self.safety_rules[ingredient_key]
            return {
                "status": rule["status"],
                "notes": rule["notes"]
            }
        
        # Try partial matches for compound ingredients
        for rule_key, rule_data in self.safety_rules.items():
            if rule_key in ingredient_key or ingredient_key in rule_key:
                return {
                    "status": rule_data["status"],
                    "notes": rule_data["notes"]
                }
        
        # Default fallback for unknown ingredients
        return {
            "status": "limited",
            "notes": "Safety not reviewed yet - consume with caution during pregnancy"
        }
    
    def check_ingredient_safety(self, ingredient_name: str, spoonacular_safety: Optional[str] = None) -> Tuple[str, str]:
        """
        Check safety of an ingredient for pregnancy.
        
        Args:
            ingredient_name: Name of the ingredient
            spoonacular_safety: Optional Spoonacular safety level (unused in JSON approach)
            
        Returns:
            Tuple of (safety_status, safety_notes)
        """
        safety_info = self.get_safety_status(ingredient_name)
        return safety_info["status"], safety_info["notes"]
    
    
    def check_food_safety(self, ingredients: List[str], spoonacular_data: Optional[Dict] = None) -> Tuple[str, str, List[Dict]]:
        """
        Check safety of a food based on its ingredients.
        
        Args:
            ingredients: List of ingredient names
            spoonacular_data: Optional Spoonacular data with safety info
            
        Returns:
            Tuple of (overall_safety_status, overall_notes, ingredient_details)
        """
        ingredient_results = []
        overall_status = "safe"
        avoid_ingredients = []
        limited_ingredients = []
        
        for ingredient in ingredients:
            # Get Spoonacular safety if available
            spoon_safety = None
            if spoonacular_data and "nutrition" in spoonacular_data:
                nutrition = spoonacular_data["nutrition"]
                if "ingredients" in nutrition:
                    for ing_data in nutrition["ingredients"]:
                        if ing_data.get("name", "").lower() == ingredient.lower():
                            spoon_safety = ing_data.get("safety_level")
                            break
            
            status, notes = self.check_ingredient_safety(ingredient, spoon_safety)
            
            ingredient_results.append({
                "name": ingredient,
                "safety_status": status,
                "safety_notes": notes
            })
            
            # Track problematic ingredients
            if status == "avoid":
                avoid_ingredients.append(ingredient)
                overall_status = "avoid"
            elif status == "limited" and overall_status != "avoid":
                limited_ingredients.append(ingredient)
                overall_status = "limited"
        
        # Generate overall notes
        if avoid_ingredients:
            overall_notes = f"Avoid during pregnancy due to: {', '.join(avoid_ingredients)}"
        elif limited_ingredients:
            overall_notes = f"Consume in moderation due to: {', '.join(limited_ingredients)}"
        else:
            overall_notes = "Generally safe for consumption during pregnancy"
        
        return overall_status, overall_notes, ingredient_results
    
    def get_safety_recommendations(self, safety_status: str) -> List[str]:
        """Get specific recommendations based on safety status."""
        recommendations = {
            "safe": [
                "This food is generally safe to consume during pregnancy",
                "Ensure proper food handling and cooking",
                "Wash fruits and vegetables thoroughly"
            ],
            "limited": [
                "Consume this food in moderation during pregnancy",
                "Follow specific preparation guidelines if applicable",
                "Consult your healthcare provider if you have concerns"
            ],
            "avoid": [
                "Avoid this food during pregnancy",
                "Choose safer alternatives",
                "Consult your healthcare provider for personalized advice"
            ]
        }
        
        return recommendations.get(safety_status, recommendations["safe"])

# Create singleton instance
pregnancy_safety_service = PregnancySafetyService()
