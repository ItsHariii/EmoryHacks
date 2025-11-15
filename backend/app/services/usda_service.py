"""
USDA FoodData Central API service for food and ingredient data retrieval.

This service handles all interactions with the USDA FoodData Central API,
including searching for foods and retrieving detailed nutrition information.
"""

import httpx
import logging
from typing import List, Dict, Any, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

# USDA FoodData Central API configuration
USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1"


class USDAService:
    """Service for interacting with USDA FoodData Central API."""
    
    def __init__(self):
        self.api_key = settings.USDA_API_KEY
        self.base_url = USDA_API_BASE_URL
    
    async def search_foods(self, query: str, page_size: int = 10) -> List[Dict[str, Any]]:
        """
        Search for foods in the USDA FoodData Central API.
        
        Args:
            query: Search term for foods
            page_size: Number of results to return (max 200)
            
        Returns:
            List of food items from USDA database
        """
        if not self.api_key:
            logger.warning("USDA_API_KEY not configured")
            return []
        
        url = f"{self.base_url}/foods/search"
        params = {
            "api_key": self.api_key,
            "query": query,
            "pageSize": min(page_size, 200),  # USDA API limit
            "dataType": ["Survey (FNDDS)", "Branded"]  # Include both survey and branded foods
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                foods = data.get("foods", [])
                
                logger.info(f"USDA search for '{query}' returned {len(foods)} results")
                return foods
                
        except httpx.HTTPStatusError as e:
            logger.error(f"USDA API HTTP error for query '{query}': {e}")
        except httpx.RequestError as e:
            logger.error(f"USDA API request error for query '{query}': {e}")
        except Exception as e:
            logger.error(f"Unexpected error searching USDA for '{query}': {e}")
        
        return []
    
    async def get_food_details(self, fdc_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information for a specific USDA food item by FDC ID.
        
        Args:
            fdc_id: USDA Food Data Central ID
            
        Returns:
            Detailed food information including nutrients, or None if not found
        """
        if not self.api_key:
            logger.warning("USDA_API_KEY not configured")
            return None
            
        url = f"{self.base_url}/food/{fdc_id}"
        params = {"api_key": self.api_key}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"USDA API returned data for food FDC ID {fdc_id}: {data.get('description', 'Unknown')}")
                return data
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"USDA food not found for FDC ID {fdc_id}")
            else:
                logger.error(f"USDA API HTTP error for FDC ID {fdc_id}: {e}")
        except httpx.RequestError as e:
            logger.error(f"USDA API request error for FDC ID {fdc_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching USDA food {fdc_id}: {e}")
        
        return None
    
    def parse_nutrients(self, usda_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse USDA nutrient data into a standardized format.
        
        Args:
            usda_data: Raw USDA food data
            
        Returns:
            Parsed nutrient data with standardized keys
        """
        nutrients = {}
        food_nutrients = usda_data.get("foodNutrients", [])
        
        # Map USDA nutrient IDs to our standard names
        nutrient_mapping = {
            1008: "calories",      # Energy
            1003: "protein",       # Protein
            1005: "carbs",         # Carbohydrate, by difference
            1004: "fat",           # Total lipid (fat)
            1079: "fiber",         # Fiber, total dietary
            2000: "sugar",         # Sugars, total including NLEA
            1093: "sodium"         # Sodium, Na
        }
        
        for nutrient in food_nutrients:
            nutrient_id = nutrient.get("nutrient", {}).get("id")
            if nutrient_id in nutrient_mapping:
                nutrient_name = nutrient_mapping[nutrient_id]
                amount = nutrient.get("amount", 0)
                unit = nutrient.get("nutrient", {}).get("unitName", "")
                
                nutrients[nutrient_name] = {
                    "amount": amount,
                    "unit": unit,
                    "percent_daily_value": nutrient.get("percentDailyValue")
                }
        
        return nutrients
    
    def extract_basic_info(self, usda_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract basic food information from USDA data.
        
        Args:
            usda_data: Raw USDA food data
            
        Returns:
            Basic food information (name, brand, ingredients, etc.)
        """
        description = usda_data.get("description", "").strip()
        brand = usda_data.get("brandOwner", "").strip() or usda_data.get("brandName", "").strip()
        
        # Extract ingredients if available
        ingredients = []
        ingredients_text = usda_data.get("ingredients", "")
        if ingredients_text:
            # Split ingredients by common delimiters
            ingredients = [
                ingredient.strip() 
                for ingredient in ingredients_text.replace(",", "\n").replace(";", "\n").split("\n")
                if ingredient.strip()
            ]
        
        return {
            "name": description,
            "brand": brand or None,
            "description": ingredients_text,
            "ingredients": ingredients,
            "category": usda_data.get("foodCategory", {}).get("description"),
            "serving_size": 100,  # USDA data is typically per 100g
            "serving_unit": "g"
        }


# Create singleton instance
usda_service = USDAService()
