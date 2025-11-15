import logging
from typing import Dict, List, Optional, Tuple
import httpx
from fastapi import HTTPException, status
from ..core.config import settings
from ..models.food import FoodSafetyStatus
from .pregnancy_safety_service import pregnancy_safety_service

logger = logging.getLogger(__name__)

# Legacy hardcoded mappings removed - now using pregnancy_safety_service with JSON rules

class USDASafetyService:
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"
    
    def __init__(self, api_key: str = settings.USDA_API_KEY):
        self.api_key = api_key
        self.client = httpx.AsyncClient()
    
    async def check_ingredient_safety(self, ingredient_name: str) -> Tuple[FoodSafetyStatus, str]:
        """
        Check the safety of an ingredient for pregnancy using the pregnancy safety service.
        Returns a tuple of (safety_status, notes)
        """
        # Use the pregnancy safety service for consistent safety checking
        safety_info = pregnancy_safety_service.get_safety_status(ingredient_name)
        
        # Convert string status to FoodSafetyStatus enum
        status_mapping = {
            "safe": FoodSafetyStatus.SAFE,
            "limited": FoodSafetyStatus.LIMITED,
            "avoid": FoodSafetyStatus.AVOID
        }
        
        safety_status = status_mapping.get(safety_info["status"], FoodSafetyStatus.LIMITED)
        return safety_status, safety_info["notes"]
    
    async def _check_usda_safety(self, ingredient_name: str) -> Tuple[FoodSafetyStatus, str]:
        """Check ingredient safety using USDA database"""
        try:
            # First search for the ingredient
            search_url = f"{self.BASE_URL}/foods/search"
            params = {
                "api_key": self.api_key,
                "query": ingredient_name,
                "pageSize": 1,
                "dataType": ["Survey (FNDDS)", "Branded"]
            }
            
            search_response = await self.client.get(search_url, params=params, timeout=10.0)
            search_response.raise_for_status()
            
            foods = search_response.json().get("foods", [])
            if not foods:
                return FoodSafetyStatus.SAFE, f"No safety information found for {ingredient_name}. " \
                                            "Please consult with your healthcare provider."
            
            # Get the first result's FDC ID
            fdc_id = foods[0].get("fdcId")
            if not fdc_id:
                return FoodSafetyStatus.SAFE, f"No detailed information available for {ingredient_name}."
            
            # Get detailed information
            detail_url = f"{self.BASE_URL}/food/{fdc_id}"
            detail_params = {"api_key": self.api_key}
            
            detail_response = await self.client.get(detail_url, params=detail_params, timeout=10.0)
            detail_response.raise_for_status()
            
            food_data = detail_response.json()
            
            # Analyze the food data for safety
            return self._analyze_food_safety(ingredient_name, food_data)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"USDA API error: {e}")
            return FoodSafetyStatus.SAFE, f"Could not verify safety of {ingredient_name}. " \
                                        "Please consult with your healthcare provider."
    
    def _analyze_food_safety(self, ingredient_name: str, food_data: Dict) -> Tuple[FoodSafetyStatus, str]:
        """Analyze food data to determine pregnancy safety"""
        # Extract relevant information
        description = food_data.get("description", "").lower()
        ingredients = food_data.get("ingredients", "").lower()
        
        # Check for raw/undercooked indicators
        raw_terms = ["raw", "unpasteurized", "undercooked", "rare", "runny", "sushi"]
        if any(term in description or term in ingredients for term in raw_terms):
            return FoodSafetyStatus.AVOID, \
                   f"{ingredient_name} appears to contain raw or unpasteurized ingredients which should be avoided during pregnancy."
        
        # Check for high-mercury fish
        high_mercury_fish = ["swordfish", "shark", "tilefish", "king mackerel", "bigeye tuna"]
        if any(fish in description for fish in high_mercury_fish):
            return FoodSafetyStatus.AVOID, \
                   f"{ingredient_name} is a high-mercury fish which should be avoided during pregnancy."
        
        # Check for soft cheeses if this is a dairy product
        soft_cheeses = ["brie", "camembert", "blue cheese", "feta", "queso fresco"]
        if any(cheese in description for cheese in soft_cheeses) and "cheese" in description:
            return FoodSafetyStatus.LIMITED, \
                   f"{ingredient_name} is a soft cheese. Make sure it's made with pasteurized milk."
        
        # If we get here, the food is likely safe
        return FoodSafetyStatus.SAFE, f"{ingredient_name} appears to be safe for pregnancy in normal amounts."
    
    async def search_usda_foods(self, query: str, limit: int = 10) -> List[Dict]:
        """Search USDA FoodData Central for foods matching query."""
        try:
            search_url = f"{self.BASE_URL}/foods/search"
            params = {
                "api_key": self.api_key,
                "query": query,
                "pageSize": limit,
                "dataType": ["Survey (FNDDS)", "Branded", "Foundation"]
            }
            
            response = await self.client.get(search_url, params=params, timeout=10.0)
            response.raise_for_status()
            
            return response.json().get("foods", [])
            
        except Exception as e:
            logger.error(f"Error searching USDA foods for '{query}': {e}")
            return []
    
    async def get_usda_food_details(self, fdc_id: int) -> Optional[Dict]:
        """Get detailed USDA food information by FDC ID."""
        try:
            detail_url = f"{self.BASE_URL}/food/{fdc_id}"
            params = {"api_key": self.api_key}
            
            response = await self.client.get(detail_url, params=params, timeout=10.0)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error getting USDA food details for FDC ID {fdc_id}: {e}")
            return None

# Create a singleton instance
usda_safety_service = USDASafetyService()
