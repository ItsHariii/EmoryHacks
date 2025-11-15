import logging
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from ..models.food import Food as FoodModel, FoodSafetyStatus
from ..services.spoonacular_service import spoonacular_service
from ..services.pregnancy_safety_service import pregnancy_safety_service
from ..services.usda_safety_service import usda_safety_service
from ..services.cache_service import cache_service

logger = logging.getLogger(__name__)

class UnifiedFoodService:
    """
    Unified service for fetching food or ingredient data.
    Handles classification, API calls, fallbacks, caching, and safety analysis.
    """
    
    def __init__(self):
        self.spoonacular = spoonacular_service
        self.pregnancy_safety = pregnancy_safety_service
        self.usda_safety = usda_safety_service
        self.cache = cache_service
    
    async def fetch_food_or_ingredient(
        self, 
        query: str, 
        db: Session,
        force_refresh: bool = False
    ) -> Optional[FoodModel]:
        """
        Unified method to fetch food or ingredient data.
        
        Pipeline:
        1. Check local cache first (unless force_refresh)
        2. Classify as product vs ingredient
        3. Fetch from appropriate Spoonacular API
        4. Fallback to USDA if needed
        5. Analyze pregnancy safety
        6. Cache results
        7. Return unified food object
        
        Args:
            query: Food/ingredient name to search for
            db: Database session
            force_refresh: Skip cache and fetch fresh data
            
        Returns:
            FoodModel object or None if not found
        """
        try:
            # Step 1: Check local cache first using enhanced cache service
            if not force_refresh:
                cached_food = self.cache.get_cached_food(db, query)
                if cached_food:
                    logger.info(f"Found cached food for '{query}': {cached_food.name}")
                    return cached_food
            
            # Step 2: Classify and search with Spoonacular
            search_result = await self.spoonacular.classify_and_search(query, 1)
            if not search_result["results"]:
                logger.warning(f"No Spoonacular results found for '{query}'")
                # Step 3: Try USDA fallback
                return await self._try_usda_fallback(query, db)
            
            food_data = search_result["results"][0]
            food_id = food_data.get("id")
            data_type = search_result["type"]
            
            logger.info(f"Classified '{query}' as {data_type}, found ID: {food_id}")
            
            # Step 4: Get detailed nutrition data
            nutrition_data = await self._get_nutrition_data(food_id, data_type)
            if not nutrition_data:
                logger.warning(f"Could not get nutrition data for {food_id}")
                return await self._try_usda_fallback(query, db)
            
            # Step 5: Extract ingredients for safety analysis
            ingredients = await self._extract_ingredients(nutrition_data, data_type, query)
            
            # Step 6: Analyze pregnancy safety
            safety_status, safety_notes = await self._analyze_pregnancy_safety(
                ingredients, nutrition_data
            )
            
            # Step 7: Create and cache food object using enhanced cache service
            food = await self._create_and_cache_food(
                db=db,
                nutrition_data=nutrition_data,
                food_id=str(food_id),
                data_type=data_type,
                safety_status=safety_status,
                safety_notes=safety_notes,
                ingredients=ingredients
            )
            
            # Use cache service for intelligent caching and deduplication
            if food:
                food = self.cache.cache_food(db, food, merge_duplicates=True)
            
            if food:
                logger.info(f"Successfully cached food '{food.name}' with safety status: {food.safety_status}")
            
            return food
            
        except Exception as e:
            logger.error(f"Error in fetch_food_or_ingredient for '{query}': {str(e)}")
            # Final fallback to USDA
            return await self._try_usda_fallback(query, db)
    
    async def _check_local_cache(self, query: str, db: Session) -> Optional[FoodModel]:
        """Check if food exists in local database."""
        # Try exact name match first
        food = db.query(FoodModel).filter(FoodModel.name.ilike(f"{query}")).first()
        if food:
            return food
        
        # Try partial match
        food = db.query(FoodModel).filter(FoodModel.name.ilike(f"%{query}%")).first()
        return food
    
    async def _get_nutrition_data(self, food_id: int, data_type: str) -> Optional[Dict[str, Any]]:
        """Get nutrition data based on classification."""
        try:
            if data_type == "product":
                return await self.spoonacular.get_product_information(food_id)
            else:
                return await self.spoonacular.get_food_information(food_id)
        except Exception as e:
            logger.error(f"Error getting nutrition data for {food_id}: {e}")
            return None
    
    async def _extract_ingredients(
        self, 
        nutrition_data: Dict[str, Any], 
        data_type: str, 
        fallback_name: str
    ) -> List[str]:
        """Extract ingredient names from nutrition data."""
        ingredients = []
        
        if data_type == "product":
            # For products, try to get ingredient list
            ingredient_list = nutrition_data.get("ingredientList", "")
            if ingredient_list:
                # Parse ingredient list (comma or semicolon separated)
                ingredients = [
                    ing.strip() for ing in ingredient_list.replace(";", ",").split(",")
                    if ing.strip()
                ]
        
        # Fallback to nutrition.ingredients or food name
        if not ingredients:
            nutrition = nutrition_data.get("nutrition", {})
            nutrition_ingredients = nutrition.get("ingredients", [])
            if nutrition_ingredients:
                ingredients = [ing.get("name", "") for ing in nutrition_ingredients if ing.get("name")]
        
        # Final fallback to the food name itself
        if not ingredients:
            food_name = nutrition_data.get("title") or nutrition_data.get("name") or fallback_name
            ingredients = [food_name]
        
        return [ing for ing in ingredients if ing]  # Filter out empty strings
    
    async def _analyze_pregnancy_safety(
        self, 
        ingredients: List[str], 
        nutrition_data: Dict[str, Any]
    ) -> Tuple[FoodSafetyStatus, str]:
        """Analyze pregnancy safety of ingredients."""
        overall_safety, overall_notes, _ = self.pregnancy_safety.check_food_safety(
            ingredients=ingredients,
            spoonacular_data=nutrition_data
        )
        
        # Map to FoodSafetyStatus enum
        safety_status_map = {
            "safe": FoodSafetyStatus.SAFE,
            "limited": FoodSafetyStatus.LIMITED,
            "avoid": FoodSafetyStatus.AVOID
        }
        
        safety_status = safety_status_map.get(overall_safety, FoodSafetyStatus.SAFE)
        return safety_status, overall_notes
    
    async def _create_and_cache_food(
        self,
        db: Session,
        nutrition_data: Dict[str, Any],
        food_id: str,
        data_type: str,
        safety_status: FoodSafetyStatus,
        safety_notes: str,
        ingredients: List[str]
    ) -> Optional[FoodModel]:
        """Create and cache food in database."""
        try:
            # Check if already exists by spoonacular_id
            existing = db.query(FoodModel).filter(FoodModel.spoonacular_id == food_id).first()
            if existing:
                return existing
            
            if data_type == "product":
                # Use product-specific data extraction
                food = FoodModel.from_spoonacular_product_data(nutrition_data)
            else:
                # Create from ingredient data
                food = FoodModel()
                food.source = 'spoonacular'
                food.spoonacular_id = food_id
                food.name = nutrition_data.get("title", "Unknown Food")
                
                # Extract nutrition
                nutrition = nutrition_data.get("nutrition", {})
                nutrients_list = nutrition.get("nutrients", [])
                
                # Initialize macronutrients
                calories = protein = carbs = fat = fiber = sugar = 0
                detailed_nutrients = {}
                
                for nutrient in nutrients_list:
                    name = nutrient.get("name", "").lower()
                    amount = nutrient.get("amount", 0)
                    unit = nutrient.get("unit", "")
                    
                    # Store in detailed nutrients
                    detailed_nutrients[name.replace(" ", "_")] = {
                        "amount": amount,
                        "unit": unit,
                        "percent_daily_value": nutrient.get("percentOfDailyNeeds")
                    }
                    
                    # Map to main columns
                    if "calories" in name or "energy" in name:
                        calories = amount
                    elif "protein" in name:
                        protein = amount
                    elif "carbohydrates" in name or "carbs" in name:
                        carbs = amount
                    elif "fat" in name and "saturated" not in name:
                        fat = amount
                    elif "fiber" in name:
                        fiber = amount
                    elif "sugar" in name:
                        sugar = amount
                
                # Set nutrition values
                food.calories = calories
                food.protein = protein
                food.carbs = carbs
                food.fat = fat
                food.fiber = fiber
                food.sugar = sugar
                food.micronutrients = detailed_nutrients
                food.serving_size = 100
                food.serving_unit = "g"
            
            # Set safety information
            food.safety_status = safety_status
            food.safety_notes = safety_notes
            food.ingredients = ingredients
            
            # Extract allergens (basic implementation)
            allergens = self._extract_allergens(nutrition_data, ingredients)
            food.allergens = allergens
            
            # Save to database
            db.add(food)
            db.commit()
            db.refresh(food)
            
            return food
            
        except Exception as e:
            logger.error(f"Error creating and caching food: {e}")
            db.rollback()
            return None
    
    def _extract_allergens(self, nutrition_data: Dict[str, Any], ingredients: List[str]) -> List[str]:
        """Extract common allergens from ingredients."""
        allergens = []
        
        # Common allergen keywords
        allergen_map = {
            "milk": ["milk", "dairy", "cheese", "butter", "cream", "yogurt", "whey", "casein"],
            "eggs": ["egg", "albumin", "mayonnaise"],
            "fish": ["fish", "salmon", "tuna", "cod", "sardine", "anchovy"],
            "shellfish": ["shrimp", "crab", "lobster", "oyster", "clam", "mussel"],
            "tree_nuts": ["almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut", "brazil nut"],
            "peanuts": ["peanut", "groundnut"],
            "wheat": ["wheat", "flour", "gluten", "bread", "pasta"],
            "soy": ["soy", "soybean", "tofu", "tempeh", "miso"]
        }
        
        # Check ingredients for allergens
        ingredients_text = " ".join(ingredients).lower()
        
        for allergen, keywords in allergen_map.items():
            if any(keyword in ingredients_text for keyword in keywords):
                allergens.append(allergen)
        
        return allergens
    
    async def _try_usda_fallback(self, query: str, db: Session) -> Optional[FoodModel]:
        """Try to fetch from USDA as fallback."""
        try:
            # Search USDA database
            usda_foods = await self._search_usda_foods(query)
            if not usda_foods:
                return None
            
            # Take the first result
            usda_food = usda_foods[0]
            fdc_id = usda_food.get("fdcId")
            
            if not fdc_id:
                return None
            
            # Check if already cached
            existing = db.query(FoodModel).filter(FoodModel.fdc_id == str(fdc_id)).first()
            if existing:
                return existing
            
            # Get detailed USDA data
            detailed_data = await self._get_usda_food_details(fdc_id)
            if not detailed_data:
                return None
            
            # Create food from USDA data
            food = FoodModel.from_usda_data(detailed_data)
            
            # Analyze safety
            ingredients = food.ingredients or [food.name]
            safety_status, safety_notes = await self._analyze_pregnancy_safety(ingredients, {})
            food.safety_status = safety_status
            food.safety_notes = safety_notes
            
            # Save to database
            db.add(food)
            db.commit()
            db.refresh(food)
            
            logger.info(f"Created food from USDA fallback: {food.name}")
            return food
            
        except Exception as e:
            logger.error(f"Error in USDA fallback for '{query}': {e}")
            return None
    
    async def _search_usda_foods(self, query: str) -> List[Dict[str, Any]]:
        """Search USDA FoodData Central."""
        try:
            return await self.usda_safety.search_usda_foods(query)
        except Exception as e:
            logger.error(f"Error searching USDA foods: {e}")
            return []
    
    async def _get_usda_food_details(self, fdc_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed USDA food data."""
        try:
            return await self.usda_safety.get_usda_food_details(fdc_id)
        except Exception as e:
            logger.error(f"Error getting USDA food details: {e}")
            return None

# Create singleton instance
unified_food_service = UnifiedFoodService()
