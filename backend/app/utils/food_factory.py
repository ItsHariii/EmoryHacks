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
from ..services.open_food_facts_service import open_food_facts_service


# Canonical micronutrient keys used across the catalog. Storing in these
# keys at ingest means DailyNutrition.add_food() doesn't need a fallback
# alias map — same shape regardless of source (USDA / OFF / Spoonacular).
_CANONICAL_MICRO_KEYS = {
    "calcium": ("calcium", "calcium_ca"),
    "iron": ("iron", "iron_fe"),
    "magnesium": ("magnesium", "magnesium_mg"),
    "zinc": ("zinc", "zinc_zn"),
    "potassium": ("potassium", "potassium_k"),
    "sodium": ("sodium", "sodium_na"),
    "vitamin_a": ("vitamin_a", "vitamin_a_rae", "vitamin_a_iu"),
    "vitamin_c": ("vitamin_c", "vitamin_c_total_ascorbic_acid"),
    "vitamin_d": ("vitamin_d", "vitamin_d_d2_d3", "vitamin_d_d2__d3"),
    "vitamin_e": ("vitamin_e", "vitamin_e_alpha_tocopherol"),
    "vitamin_b6": ("vitamin_b6", "vitamin_b_6"),
    "vitamin_b12": ("vitamin_b12", "vitamin_b_12"),
    "folate": ("folate", "folate_total", "folate_dfe"),
    "choline": ("choline", "choline_total"),
    "thiamin": ("thiamin", "thiamine"),
    "riboflavin": ("riboflavin",),
    "niacin": ("niacin",),
    "cholesterol": ("cholesterol",),
    "saturated_fat": ("saturated_fat", "fatty_acids_total_saturated"),
    "trans_fat": ("trans_fat", "fatty_acids_total_trans"),
    "caffeine": ("caffeine",),
    "alcohol": ("alcohol", "alcohol_ethyl"),
    "omega3": ("omega3", "omega_3", "n_3"),
    "dha": ("dha", "22_6"),
}


def _canonicalize_micros(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """Rename USDA-shaped nutrient keys to canonical names in-place.

    USDA `parse_nutrients` uses the FDC id-map for known nutrients and falls
    back to `name.lower().replace(' ', '_').replace(',', '')` for the rest.
    That fallback emits keys like `calcium_ca` / `vitamin_b_6` / `22:6`. This
    helper normalizes those onto the canonical names so downstream
    aggregation can read them with a single key lookup.
    """
    if not isinstance(parsed, dict):
        return parsed or {}

    # Index existing keys lowercased once for substring matching of the DHA /
    # omega-3 cases USDA encodes by lipid notation.
    out: Dict[str, Any] = {}
    used: set = set()

    for canonical, aliases in _CANONICAL_MICRO_KEYS.items():
        for alias in aliases:
            if alias in parsed and alias not in used:
                out[canonical] = parsed[alias]
                used.add(alias)
                break
        # Also catch DHA / omega-3 encoded with colons or hyphens.
        if canonical == "dha" and "dha" not in out:
            for k in parsed:
                kl = str(k).lower()
                if "22:6" in kl or kl.endswith("_dha") or kl == "dha":
                    out["dha"] = parsed[k]
                    used.add(k)
                    break
        if canonical == "omega3" and "omega3" not in out:
            for k in parsed:
                kl = str(k).lower()
                if "n-3" in kl or "omega-3" in kl or kl == "omega_3":
                    out["omega3"] = parsed[k]
                    used.add(k)
                    break

    # Preserve any other parsed entries (rare / branded-only micros) under
    # their original keys so we don't lose data.
    for k, v in parsed.items():
        if k not in used and k not in out:
            out[k] = v

    return out

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
            nutrients = _canonicalize_micros(nutrients)

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
                fdc_id=str(fdc_id),
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
            # Normalize USDA-shaped keys onto our canonical names so
            # DailyNutrition / DailyNutritionTargets read with a single
            # lookup instead of a fallback alias map.
            nutrients = _canonicalize_micros(nutrients)

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
                fdc_id=str(fdc_id),
                source=FoodSource.USDA
            )
            
            # Apply pregnancy safety verdict via the layered pipeline so the
            # row carries ingredient findings + citations, not just a status.
            verdict = await pregnancy_safety_service.evaluate_async(
                new_food.ingredients or [new_food.name],
                food_category=basic_info.get("category"),
            )
            new_food.safety_status = verdict["status"]
            new_food.safety_notes = verdict["summary"]
            new_food.safety_verdict = verdict

            db.add(new_food)
            db.commit()
            db.refresh(new_food)

            logger.info(f"Created USDA food: {basic_info['name']}")
            return new_food
            
        except Exception as e:
            logger.error(f"Error creating USDA food {fdc_id}: {str(e)}")
            db.rollback()
            return None


    @staticmethod
    async def create_food_from_off(
        db: Session,
        product: Dict[str, Any],
    ) -> Optional[Food]:
        """Create a Food row from an Open Food Facts product payload.

        Dedupes on `off_id` (the barcode) so repeated lookups return the
        existing row instead of inserting duplicates. Runs the layered
        pregnancy safety pipeline against the parsed ingredients and
        category so the verdict is populated at ingest time.
        """
        try:
            basic = open_food_facts_service.extract_basic_info(product)
            barcode = basic["barcode"]
            if not barcode:
                logger.warning("OFF product missing barcode; skipping cache")
                return None

            existing = db.query(Food).filter(Food.off_id == barcode).first()
            if existing:
                return existing

            nutrients = open_food_facts_service.parse_nutrients(product)
            nutrients = _canonicalize_micros(nutrients)

            new_food = Food(
                name=basic["name"],
                description=basic["description"],
                brand=basic["brand"],
                category=basic["category"],
                serving_size=basic["serving_size"],
                serving_unit=basic["serving_unit"],
                calories=(nutrients.get("calories") or {}).get("amount") or 0,
                protein=(nutrients.get("protein") or {}).get("amount") or 0,
                carbs=(nutrients.get("carbs") or {}).get("amount") or 0,
                fat=(nutrients.get("fat") or {}).get("amount") or 0,
                fiber=(nutrients.get("fiber") or {}).get("amount"),
                sugar=(nutrients.get("sugar") or {}).get("amount"),
                micronutrients=nutrients,
                ingredients=basic["ingredients"] or [],
                allergens=basic["allergens"] or [],
                off_id=barcode,
                source=FoodSource.OPEN_FOOD_FACTS,
            )

            verdict = await pregnancy_safety_service.evaluate_async(
                new_food.ingredients or [new_food.name],
                food_category=new_food.category,
            )
            new_food.safety_status = verdict["status"]
            new_food.safety_notes = verdict["summary"]
            new_food.safety_verdict = verdict

            db.add(new_food)
            db.commit()
            db.refresh(new_food)

            logger.info("Created OFF food: %s (barcode=%s)", new_food.name, barcode)
            return new_food

        except IntegrityError as e:
            db.rollback()
            logger.warning("OFF food integrity error (likely race): %s", e)
            return db.query(Food).filter(
                Food.off_id == basic.get("barcode") if 'basic' in locals() else None
            ).first()
        except Exception as e:
            logger.error("Error creating OFF food: %s", e)
            db.rollback()
            return None


# Create singleton instance
food_factory = FoodFactory()
