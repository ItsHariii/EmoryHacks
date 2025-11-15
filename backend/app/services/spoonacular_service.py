import httpx
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from ..core.config import settings
from .rate_limiter import spoonacular_client, retry_handler
from .pregnancy_safety_service import pregnancy_safety_service

logger = logging.getLogger(__name__)

class SpoonacularService:
    BASE_URL = "https://api.spoonacular.com"
    
    def __init__(self, api_key: str = settings.SPOONACULAR_API_KEY):
        self.api_key = api_key
        self.client = spoonacular_client
    
    async def classify_and_search(self, query: str, number: int = 10) -> Dict[str, Any]:
        """
        Classify query as product or ingredient and search accordingly.
        Returns both classification and results.
        """
        # Classification logic based on query patterns
        is_product = self._classify_as_product(query)
        
        if is_product:
            # Search products first for packaged foods
            products = await self.search_grocery_products(query, number)
            if products:
                return {
                    "type": "product",
                    "results": products,
                    "fallback_attempted": False
                }
            
            # Fallback to ingredients if no products found
            ingredients = await self.search_ingredients(query, number)
            return {
                "type": "ingredient",
                "results": ingredients,
                "fallback_attempted": True
            }
        else:
            # Search ingredients first for raw ingredients
            ingredients = await self.search_ingredients(query, number)
            if ingredients:
                return {
                    "type": "ingredient", 
                    "results": ingredients,
                    "fallback_attempted": False
                }
            
            # If no ingredients found, maintain ingredient classification for basic foods
            # This ensures USDA fallback works for common ingredients like apple, banana
            if self._is_basic_ingredient(query):
                return {
                    "type": "ingredient",
                    "results": [],
                    "fallback_attempted": False
                }
            
            # Fallback to products only for non-basic ingredients
            products = await self.search_grocery_products(query, number)
            return {
                "type": "product",
                "results": products,
                "fallback_attempted": True
            }
    
    def _classify_as_product(self, query: str) -> bool:
        """
        Classify query as likely product (packaged food) vs ingredient (raw food).
        Returns True if likely a product, False if likely an ingredient.
        """
        query_lower = query.lower().strip()
        
        # Product indicators - brand names, packaged food terms
        product_indicators = [
            # Brand names
            'kraft', 'nestle', 'kellogg', 'general mills', 'pepsi', 'coca cola', 'frito lay',
            'campbell', 'heinz', 'oreo', 'cheerios', 'doritos', 'lay\'s', 'pringles',
            
            # Packaged food terms
            'cereal', 'crackers', 'chips', 'cookies', 'frozen', 'canned', 'bottled',
            'packaged', 'instant', 'mix', 'sauce', 'dressing', 'snack', 'bar',
            'yogurt', 'cheese', 'bread', 'pasta', 'pizza', 'soup', 'juice',
            
            # Specific product patterns
            'whole wheat', 'low fat', 'organic', 'gluten free', 'sugar free'
        ]
        
        # Ingredient indicators - raw, unprocessed foods
        ingredient_indicators = [
            'fresh', 'raw', 'ground', 'chopped', 'diced', 'sliced', 'whole',
            'apple', 'banana', 'carrot', 'onion', 'garlic', 'tomato', 'potato',
            'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
            'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 'egg',
            'rice', 'beans', 'lentils', 'quinoa', 'oats'
        ]
        
        # Check for product indicators
        product_score = sum(1 for indicator in product_indicators if indicator in query_lower)
        
        # Check for ingredient indicators  
        ingredient_score = sum(1 for indicator in ingredient_indicators if indicator in query_lower)
        
        # Additional heuristics
        if len(query.split()) > 3:  # Multi-word queries often products
            product_score += 1
        
        if any(char.isdigit() for char in query):  # Numbers often in product names
            product_score += 1
            
        # Return True if more likely a product
        return product_score > ingredient_score
    
    def _is_basic_ingredient(self, query: str) -> bool:
        """
        Check if query is a basic ingredient that should always be classified as ingredient.
        Used to ensure USDA fallback works for common foods.
        """
        query_lower = query.lower().strip()
        
        # Common basic ingredients that should always use USDA fallback
        basic_ingredients = [
            'apple', 'banana', 'carrot', 'onion', 'garlic', 'tomato', 'potato',
            'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'egg', 'eggs',
            'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 
            'rice', 'beans', 'lentils', 'quinoa', 'oats', 'milk',
            'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'grape',
            'lettuce', 'spinach', 'broccoli', 'cauliflower', 'cucumber',
            'cheese', 'yogurt', 'bread', 'pasta'
        ]
        
        # Check for exact match or plural/singular variants
        for ingredient in basic_ingredients:
            if (query_lower == ingredient or 
                query_lower == ingredient + 's' or 
                query_lower + 's' == ingredient):
                return True
        
        return False

    async def search_ingredients(self, query: str, number: int = 10) -> List[Dict[str, Any]]:
        """Search for ingredient items using Spoonacular Ingredients API"""
        endpoint = f"{self.BASE_URL}/food/ingredients/search"
        
        # Try both singular and plural forms to get better results
        search_queries = [query]
        if not query.endswith('s'):
            search_queries.append(query + 's')
        elif query.endswith('s') and len(query) > 3:
            search_queries.append(query[:-1])
            
        all_results = []
        seen_ids = set()
        
        for search_query in search_queries:
            params = {
                "apiKey": self.api_key,
                "query": search_query,
                "number": number,
                "sort": "calories",
                "sortDirection": "desc"
            }
            
            try:
                response = await self.client.get(endpoint, params=params)
                results = response.json().get("results", [])
                
                # Add unique results
                for result in results:
                    result_id = result.get("id")
                    if result_id not in seen_ids:
                        seen_ids.add(result_id)
                        all_results.append(result)
                        
            except Exception as e:
                logger.error(f"Spoonacular Ingredients API error for '{search_query}': {e}")
                continue
        
        # Prioritize basic ingredients over processed foods
        def ingredient_priority(item):
            name = item.get("name", "").lower()
            original_query = query.lower()
            
            # Exact match gets highest priority
            if name == original_query:
                return 0
            
            # Close match (singular/plural) gets second priority
            if (name == original_query + 's') or (name + 's' == original_query):
                return 1
                
            # Basic ingredients (short names, no processed terms) get third priority
            if len(name.split()) <= 2 and not any(word in name for word in ["dried", "canned", "frozen", "juice", "sauce", "butter", "pie", "jelly", "jam"]):
                return 2
                
            # Everything else gets lower priority
            return 3
        
        all_results.sort(key=ingredient_priority)
        return all_results[:number]

    async def search_grocery_products(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for grocery products using Spoonacular Products API"""
        endpoint = f"{self.BASE_URL}/food/products/search"
        params = {
            "apiKey": self.api_key,
            "query": query,
            "number": limit
        }
        
        try:
            response = await self.client.get(endpoint, params=params)
            return response.json().get("products", [])
        except Exception as e:
            logger.error(f"Spoonacular Products API error: {e}")
            return []

    async def fetch_nutrition(self, food_id: int, search_type: str) -> Dict[str, Any]:
        """
        Unified nutrition fetcher that calls the right endpoint based on classification.
        """
        if search_type == "product":
            return await self.get_product_information(food_id)
        return await self.get_food_information(food_id, amount=100, unit="g")

    async def get_product_information(self, product_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific grocery product"""
        endpoint = f"{self.BASE_URL}/food/products/{product_id}"
        params = {
            "apiKey": self.api_key
        }
        
        try:
            response = await self.client.get(endpoint, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Spoonacular product endpoint doesn't provide detailed nutrition
            # Try to get nutrition from the ingredient endpoint as fallback
            nutrition = data.get('nutrition', {})
            nutrients = nutrition.get('nutrients', [])
            
            # Check if nutrition data is missing or all zeros
            has_meaningful_nutrition = False
            if nutrients:
                for nutrient in nutrients:
                    amount = nutrient.get('amount', 0)
                    name = nutrient.get('name', '').lower()
                    # Check for key nutrients with non-zero values
                    if amount > 0 and any(key in name for key in ['calorie', 'carbohydrate', 'sugar', 'protein', 'fat']):
                        has_meaningful_nutrition = True
                        break
            
            if not nutrition or not nutrients or not has_meaningful_nutrition:
                logger.info(f"No meaningful nutrition data from product endpoint for {product_id}, trying ingredient endpoint")
                ingredient_data = await self.get_food_information(product_id, amount=100, unit="g")
                if ingredient_data.get('nutrition'):
                    data['nutrition'] = ingredient_data['nutrition']
                    logger.info(f"Retrieved nutrition data from ingredient endpoint for {product_id}")
            
            # Add pregnancy safety information for products
            product_name = data.get('title', '')
            if product_name:
                safety_info = pregnancy_safety_service.get_safety_status(product_name)
                data['pregnancy_safety'] = safety_info
                logger.info(f"Added pregnancy safety info for product {product_name}: {safety_info['status']}")
            
            return data
        except httpx.HTTPStatusError as e:
            logger.error(f"Spoonacular Product Info API error: {e}")
            return {}

    async def get_food_information(self, food_id: int, amount: int = 100, unit: str = "g") -> Dict[str, Any]:
        """Get detailed nutrition information for a specific food item"""
        endpoint = f"{self.BASE_URL}/food/ingredients/{food_id}/information"
        params = {
            "apiKey": self.api_key,
            "amount": amount,
            "unit": unit
        }
        
        try:
            response = await self.client.get(endpoint, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Add pregnancy safety information
            ingredient_name = data.get('name', '')
            if ingredient_name:
                safety_info = pregnancy_safety_service.get_safety_status(ingredient_name)
                data['pregnancy_safety'] = safety_info
                logger.info(f"Added pregnancy safety info for {ingredient_name}: {safety_info['status']}")
            
            return data
        except httpx.HTTPStatusError as e:
            logger.error(f"Spoonacular API error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Error fetching food details from Spoonacular"
            )
    
    async def extract_ingredients_from_recipe(self, recipe_text: str) -> List[Dict[str, Any]]:
        """Extract ingredients from recipe text or URL"""
        endpoint = f"{self.BASE_URL}/recipes/extract"
        params = {
            "apiKey": self.api_key,
            "url": recipe_text if recipe_text.startswith('http') else None,
            "analyze": True
        }
        
        try:
            response = await self.client.get(endpoint, params=params, timeout=15.0)
            response.raise_for_status()
            return response.json().get("extendedIngredients", [])
        except httpx.HTTPStatusError as e:
            logger.error(f"Spoonacular recipe extraction error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract ingredients from the provided recipe"
            )

# Create a singleton instance
spoonacular_service = SpoonacularService()
