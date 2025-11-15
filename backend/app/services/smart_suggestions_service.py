"""
Smart food suggestions service for pregnancy nutrition.
Analyzes user's food logs and provides personalized recommendations.
"""
import logging
from datetime import datetime, timedelta, date as date_type
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.food import Food, FoodLog
from ..schemas.food import DailyNutrition
from ..services.pregnancy_safety_service import PregnancySafetyService

logger = logging.getLogger(__name__)

class SmartSuggestionsService:
    """
    Service for generating smart food suggestions based on user's dietary patterns,
    nutritional needs, and pregnancy safety requirements.
    """
    
    def __init__(self):
        self.safety_service = PregnancySafetyService()
        
        # Pregnancy nutrition targets by trimester
        self.nutrition_targets = {
            1: {  # First trimester
                "calories": 2200,
                "protein_g": 75,
                "calcium_mg": 1000,
                "iron_mg": 27,
                "folate_mcg": 600,
                "vitamin_d_mcg": 15,
                "fiber_g": 28
            },
            2: {  # Second trimester
                "calories": 2400,
                "protein_g": 80,
                "calcium_mg": 1200,
                "iron_mg": 27,
                "folate_mcg": 600,
                "vitamin_d_mcg": 15,
                "fiber_g": 28
            },
            3: {  # Third trimester
                "calories": 2600,
                "protein_g": 85,
                "calcium_mg": 1200,
                "iron_mg": 27,
                "folate_mcg": 600,
                "vitamin_d_mcg": 15,
                "fiber_g": 28
            }
        }
        
        # Safe high-nutrient foods by category
        self.nutrient_rich_foods = {
            "protein": [
                {"name": "Greek Yogurt", "protein_per_100g": 20, "safety": "safe"},
                {"name": "Cooked Chicken Breast", "protein_per_100g": 31, "safety": "safe"},
                {"name": "Lentils", "protein_per_100g": 9, "safety": "safe"},
                {"name": "Eggs", "protein_per_100g": 13, "safety": "safe"},
                {"name": "Tofu", "protein_per_100g": 8, "safety": "safe"},
                {"name": "Quinoa", "protein_per_100g": 4.4, "safety": "safe"}
            ],
            "calcium": [
                {"name": "Low-fat Milk", "calcium_per_100g": 125, "safety": "safe"},
                {"name": "Cheddar Cheese", "calcium_per_100g": 721, "safety": "safe"},
                {"name": "Sardines", "calcium_per_100g": 382, "safety": "safe"},
                {"name": "Kale", "calcium_per_100g": 150, "safety": "safe"},
                {"name": "Almonds", "calcium_per_100g": 269, "safety": "safe"}
            ],
            "iron": [
                {"name": "Spinach", "iron_per_100g": 2.7, "safety": "safe"},
                {"name": "Lean Beef", "iron_per_100g": 2.6, "safety": "safe"},
                {"name": "Fortified Cereal", "iron_per_100g": 18, "safety": "safe"},
                {"name": "White Beans", "iron_per_100g": 3.7, "safety": "safe"},
                {"name": "Dark Chocolate", "iron_per_100g": 7.7, "safety": "limited"}
            ],
            "folate": [
                {"name": "Asparagus", "folate_per_100g": 149, "safety": "safe"},
                {"name": "Avocado", "folate_per_100g": 81, "safety": "safe"},
                {"name": "Brussels Sprouts", "folate_per_100g": 61, "safety": "safe"},
                {"name": "Orange", "folate_per_100g": 40, "safety": "safe"},
                {"name": "Fortified Bread", "folate_per_100g": 120, "safety": "safe"}
            ],
            "fiber": [
                {"name": "Raspberries", "fiber_per_100g": 6.5, "safety": "safe"},
                {"name": "Apple with Skin", "fiber_per_100g": 2.4, "safety": "safe"},
                {"name": "Oatmeal", "fiber_per_100g": 10.6, "safety": "safe"},
                {"name": "Black Beans", "fiber_per_100g": 8.7, "safety": "safe"},
                {"name": "Broccoli", "fiber_per_100g": 2.6, "safety": "safe"}
            ]
        }
    
    def get_daily_nutrition_summary(self, db: Session, user: User, target_date: date_type) -> DailyNutrition:
        """Get nutrition summary for a specific date."""
        logs = (
            db.query(FoodLog)
            .join(Food, FoodLog.food_id == Food.id)
            .filter(
                FoodLog.user_id == user.id,
                FoodLog.deleted_at.is_(None),
                db.func.date(FoodLog.consumed_at) == target_date
            )
            .all()
        )
        
        daily_nutrition = DailyNutrition(date=target_date)
        for log in logs:
            daily_nutrition.add_food(log.food, log.quantity)
        
        return daily_nutrition
    
    def identify_nutritional_gaps(self, user: User, daily_nutrition: DailyNutrition) -> List[Dict[str, Any]]:
        """Identify nutritional gaps based on trimester targets."""
        trimester = user.trimester
        targets = self.nutrition_targets.get(trimester, self.nutrition_targets[1])
        
        gaps = []
        
        # Check protein
        if daily_nutrition.protein_g < targets["protein_g"] * 0.8:  # 80% threshold
            deficit = targets["protein_g"] - daily_nutrition.protein_g
            gaps.append({
                "nutrient": "protein",
                "current": daily_nutrition.protein_g,
                "target": targets["protein_g"],
                "deficit": deficit,
                "priority": "high" if deficit > 20 else "medium"
            })
        
        # Check calcium
        if daily_nutrition.calcium_mg < targets["calcium_mg"] * 0.7:  # 70% threshold
            deficit = targets["calcium_mg"] - daily_nutrition.calcium_mg
            gaps.append({
                "nutrient": "calcium",
                "current": daily_nutrition.calcium_mg,
                "target": targets["calcium_mg"],
                "deficit": deficit,
                "priority": "high" if deficit > 400 else "medium"
            })
        
        # Check iron
        if daily_nutrition.iron_mg < targets["iron_mg"] * 0.8:  # 80% threshold
            deficit = targets["iron_mg"] - daily_nutrition.iron_mg
            gaps.append({
                "nutrient": "iron",
                "current": daily_nutrition.iron_mg,
                "target": targets["iron_mg"],
                "deficit": deficit,
                "priority": "high"  # Iron is always high priority in pregnancy
            })
        
        # Check folate
        if daily_nutrition.folate_mcg < targets["folate_mcg"] * 0.8:  # 80% threshold
            deficit = targets["folate_mcg"] - daily_nutrition.folate_mcg
            gaps.append({
                "nutrient": "folate",
                "current": daily_nutrition.folate_mcg,
                "target": targets["folate_mcg"],
                "deficit": deficit,
                "priority": "high"  # Folate is critical in pregnancy
            })
        
        # Check fiber
        if daily_nutrition.fiber_g < targets["fiber_g"] * 0.7:  # 70% threshold
            deficit = targets["fiber_g"] - daily_nutrition.fiber_g
            gaps.append({
                "nutrient": "fiber",
                "current": daily_nutrition.fiber_g,
                "target": targets["fiber_g"],
                "deficit": deficit,
                "priority": "medium"
            })
        
        return gaps
    
    def generate_food_suggestions(self, gaps: List[Dict[str, Any]], max_suggestions: int = 3) -> List[Dict[str, Any]]:
        """Generate food suggestions based on nutritional gaps."""
        suggestions = []
        
        # Sort gaps by priority (high first)
        priority_order = {"high": 0, "medium": 1, "low": 2}
        gaps.sort(key=lambda x: priority_order.get(x["priority"], 2))
        
        for gap in gaps[:max_suggestions]:  # Limit to max suggestions
            nutrient = gap["nutrient"]
            foods = self.nutrient_rich_foods.get(nutrient, [])
            
            if foods:
                # Pick the best food for this nutrient (first in list is usually best)
                recommended_food = foods[0]
                
                suggestions.append({
                    "nutrient_gap": nutrient,
                    "food_name": recommended_food["name"],
                    "reason": f"High in {nutrient} - you need {gap['deficit']:.1f} more {self._get_nutrient_unit(nutrient)}",
                    "safety_status": recommended_food["safety"],
                    "priority": gap["priority"],
                    "serving_suggestion": self._get_serving_suggestion(nutrient, recommended_food)
                })
        
        return suggestions
    
    def _get_nutrient_unit(self, nutrient: str) -> str:
        """Get the unit for a nutrient."""
        units = {
            "protein": "g",
            "calcium": "mg", 
            "iron": "mg",
            "folate": "mcg",
            "fiber": "g"
        }
        return units.get(nutrient, "")
    
    def _get_serving_suggestion(self, nutrient: str, food: Dict[str, Any]) -> str:
        """Get serving suggestion for a food."""
        suggestions = {
            "Greek Yogurt": "1 cup (170g) as a snack or with berries",
            "Cooked Chicken Breast": "3-4 oz (85-115g) with dinner",
            "Lentils": "1/2 cup cooked with lunch or dinner",
            "Eggs": "1-2 eggs for breakfast or as a snack",
            "Spinach": "1 cup raw in salads or 1/2 cup cooked",
            "Low-fat Milk": "1 glass (240ml) with meals or snacks",
            "Avocado": "1/2 medium avocado on toast or in salads",
            "Oatmeal": "1 cup cooked for breakfast with fruit"
        }
        
        return suggestions.get(food["name"], f"1 serving of {food['name']}")
    
    def get_smart_suggestions(self, db: Session, user: User) -> Dict[str, Any]:
        """
        Generate smart food suggestions for the user based on today's intake.
        """
        today = datetime.now().date()
        
        # Get today's nutrition summary
        daily_nutrition = self.get_daily_nutrition_summary(db, user, today)
        
        # Identify nutritional gaps
        gaps = self.identify_nutritional_gaps(user, daily_nutrition)
        
        # Generate food suggestions
        suggestions = self.generate_food_suggestions(gaps, max_suggestions=3)
        
        # Get trimester-specific advice
        trimester_advice = self._get_trimester_advice(user.trimester)
        
        return {
            "date": today.isoformat(),
            "trimester": user.trimester,
            "current_nutrition": {
                "calories": daily_nutrition.total_calories,
                "protein_g": daily_nutrition.protein_g,
                "calcium_mg": daily_nutrition.calcium_mg,
                "iron_mg": daily_nutrition.iron_mg,
                "folate_mcg": daily_nutrition.folate_mcg,
                "fiber_g": daily_nutrition.fiber_g
            },
            "nutrition_targets": self.nutrition_targets.get(user.trimester, self.nutrition_targets[1]),
            "identified_gaps": gaps,
            "food_suggestions": suggestions,
            "trimester_advice": trimester_advice,
            "general_tips": [
                "Eat small, frequent meals to help with nausea and energy",
                "Stay hydrated with 8-10 glasses of water daily",
                "Take your prenatal vitamins as recommended by your doctor",
                "Wash all fruits and vegetables thoroughly before eating"
            ]
        }
    
    def _get_trimester_advice(self, trimester: int) -> List[str]:
        """Get trimester-specific nutritional advice."""
        advice = {
            1: [
                "Focus on folate-rich foods to support neural tube development",
                "Small, frequent meals can help with morning sickness",
                "Ginger can help reduce nausea naturally"
            ],
            2: [
                "Increase calcium intake for baby's bone development",
                "Iron needs increase - pair with vitamin C for better absorption",
                "This is often the easiest trimester for eating - build good habits"
            ],
            3: [
                "Continue high calcium and iron intake",
                "Smaller, more frequent meals as baby grows",
                "Stay hydrated to help prevent swelling"
            ]
        }
        
        return advice.get(trimester, advice[1])

# Create singleton instance
smart_suggestions_service = SmartSuggestionsService()
