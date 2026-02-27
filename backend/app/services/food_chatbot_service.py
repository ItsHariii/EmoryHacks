"""
Food Nutrition Chatbot Service using Gemini AI.

This service provides conversational AI assistance for pregnancy nutrition questions.
It extracts food items from questions, gathers nutrition data, and provides
pregnancy-specific advice using Google Gemini.
"""

import logging
from typing import Any, Dict, List

from app.services.usda_service import usda_service
from app.services.ai_client import (
    food_gemini_client,
    AIServiceUnavailable,
    AIRequestFailed,
    AITimeoutError,
    extract_text_from_response,
)

logger = logging.getLogger(__name__)


class FoodChatbotService:
    """Service for handling food nutrition chatbot conversations."""

    def __init__(self) -> None:
        self.client = food_gemini_client

        logger.info("Initializing FoodChatbotService...")
        logger.info("Gemini food client configured: %s", bool(self.client.is_configured))
        if not self.client.is_configured:
            logger.warning(
                "GEMINI_FOOD_API_KEY/GEMINI_API_KEY not configured - nutrition chatbot will be disabled."
            )

    async def ask_question(self, question: str, user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Ask a pregnancy nutrition question and get an AI-powered response.

        Args:
            question: User's question about food/nutrition
            user_context: Optional user context (trimester, allergies, etc.)

        Returns:
            Dict with answer, nutrition_data, and sources
        """
        if not self.client.is_available:
            return {
                "answer": (
                    "I'm sorry, but the nutrition chatbot is currently unavailable. "
                    "Please try again later or use the manual nutrition search."
                ),
                "nutrition_data": {},
                "sources": [],
                "error": "service_unavailable",
            }

        try:
            # Step 1: Extract food items from the question
            food_items = await self._extract_food_items(question)
            logger.info("Extracted food items from question: %s", food_items)

            # Step 2: Gather nutrition data from USDA
            nutrition_data = await self._gather_nutrition_data(food_items)

            # Step 3: Generate response with Gemini
            answer = await self._generate_response(question, nutrition_data, user_context)

            return {
                "answer": answer,
                "nutrition_data": nutrition_data,
                "food_items": food_items,
                "sources": ["USDA FoodData Central", "Google Gemini AI"],
            }

        except (AIServiceUnavailable, AIRequestFailed, AITimeoutError) as e:
            logger.error("Gemini error in ask_question: %s", e, exc_info=True)
            return {
                "answer": (
                    "I'm having trouble reaching the nutrition assistant right now. "
                    "Please try again in a bit or use the manual nutrition search."
                ),
                "nutrition_data": {},
                "sources": [],
                "error": "ai_unavailable",
            }
        except Exception as e:
            logger.error("Unexpected error in ask_question: %s", e, exc_info=True)
            return {
                "answer": (
                    "I apologize, but I encountered an unexpected error. "
                    "Please try rephrasing your question or use the manual nutrition search."
                ),
                "nutrition_data": {},
                "sources": [],
                "error": str(e),
            }

    async def _extract_food_items(self, question: str) -> List[str]:
        """Extract food item names from the user's question."""
        if not self.client.is_available:
            # Fallback: return the question as a single food item
            return [question]

        try:
            prompt = f"""Extract ONLY the food item names from this question. Return them as a comma-separated list.
If no specific foods are mentioned, return an empty list.

Question: "{question}"

Food items (comma-separated):"""
            response = await self.client.generate_content(prompt)
            text = extract_text_from_response(response)

            if not text or text.lower() in ['none', 'empty', '']:
                return []

            food_items = [item.strip() for item in text.split(',') if item.strip()]
            return food_items[:3]  # Limit to 3 items for performance

        except (AIServiceUnavailable, AIRequestFailed, AITimeoutError) as e:
            logger.error("Gemini error extracting food items: %s", e)
            return []
        except Exception as e:
            logger.error("Error extracting food items: %s", e, exc_info=True)
            return []

    async def _gather_nutrition_data(self, food_items: List[str]) -> Dict[str, Any]:
        """Gather nutrition data from USDA for the extracted food items."""
        nutrition_data = {}
        
        for food_item in food_items:
            try:
                # Search USDA database
                usda_results = await usda_service.search_foods(food_item, page_size=1)
                
                if usda_results and isinstance(usda_results, list) and len(usda_results) > 0:
                    best_match = usda_results[0]
                    
                    # Ensure best_match is a dictionary
                    if not isinstance(best_match, dict):
                        logger.error(f"Unexpected data type for {food_item}: {type(best_match)}")
                        nutrition_data[food_item] = {
                            "source": "USDA",
                            "error": "Invalid data format"
                        }
                        continue
                    
                    nutrients = usda_service.parse_nutrients(best_match)
                    basic_info = usda_service.extract_basic_info(best_match)
                    
                    # Safely extract nutrient values
                    def get_nutrient_amount(nutrient_dict):
                        if isinstance(nutrient_dict, dict):
                            return nutrient_dict.get("amount", 0)
                        return 0
                    
                    nutrition_data[food_item] = {
                        "source": "USDA",
                        "name": basic_info.get("name") if isinstance(basic_info, dict) else food_item,
                        "calories": get_nutrient_amount(nutrients.get("calories")),
                        "protein": get_nutrient_amount(nutrients.get("protein")),
                        "carbs": get_nutrient_amount(nutrients.get("carbs")),
                        "fat": get_nutrient_amount(nutrients.get("fat")),
                        "key_nutrients": {
                            "calcium": get_nutrient_amount(nutrients.get("calcium")),
                            "iron": get_nutrient_amount(nutrients.get("iron")),
                            "folate": get_nutrient_amount(nutrients.get("folate")),
                            "vitamin_d": get_nutrient_amount(nutrients.get("vitamin_d")),
                        }
                    }
                else:
                    nutrition_data[food_item] = {
                        "source": "USDA",
                        "error": "No data found"
                    }
                    
            except Exception as e:
                logger.error(f"Error gathering data for {food_item}: {e}", exc_info=True)
                nutrition_data[food_item] = {
                    "error": str(e)
                }
        
        return nutrition_data

    async def _generate_response(
        self, 
        question: str, 
        nutrition_data: Dict[str, Any],
        user_context: Dict[str, Any] = None
    ) -> str:
        """Generate a pregnancy-focused response using Gemini."""
        if not self.client.is_available:
            return "The nutrition assistant is currently unavailable. Please try again later."

        try:
            # Build context from nutrition data
            context_parts = []

            if nutrition_data:
                context_parts.append("Nutrition data from USDA:")
                for food, data in nutrition_data.items():
                    if "error" not in data:
                        context_parts.append(f"\n{food}:")
                        context_parts.append(f"  - Calories: {data.get('calories', 'N/A')} kcal")
                        context_parts.append(f"  - Protein: {data.get('protein', 'N/A')}g")
                        context_parts.append(f"  - Carbs: {data.get('carbs', 'N/A')}g")
                        context_parts.append(f"  - Fat: {data.get('fat', 'N/A')}g")

                        key_nutrients = data.get('key_nutrients', {})
                        if any(key_nutrients.values()):
                            context_parts.append("  - Key pregnancy nutrients:")
                            if key_nutrients.get('calcium'):
                                context_parts.append(f"    • Calcium: {key_nutrients['calcium']}mg")
                            if key_nutrients.get('iron'):
                                context_parts.append(f"    • Iron: {key_nutrients['iron']}mg")
                            if key_nutrients.get('folate'):
                                context_parts.append(f"    • Folate: {key_nutrients['folate']}mcg")

            context = "\n".join(context_parts) if context_parts else "No specific nutrition data available."

            # Add user context
            user_info = ""
            if user_context:
                trimester = user_context.get('trimester')
                if trimester:
                    user_info = f"\nUser is in trimester {trimester} of pregnancy."

            # Create pregnancy-focused prompt
            prompt = f"""You are Ovi, a friendly and knowledgeable pregnancy nutrition assistant. 
Your role is to provide helpful, accurate, and empathetic advice about food and nutrition during pregnancy.

{context}
{user_info}

User Question: {question}

Provide a warm, conversational response that:
1. Directly answers their question
2. Addresses pregnancy safety concerns if relevant
3. Highlights important nutritional benefits
4. Provides practical, actionable advice
5. Is encouraging and supportive
6. Keeps the response concise (2-3 paragraphs max)

If the question is about food safety, be clear about what's safe, what to limit, and what to avoid.
If nutrition data is available, reference specific nutrients that are beneficial during pregnancy.

Response:"""

            response = await self.client.generate_content(prompt)
            text = extract_text_from_response(response)
            if not text:
                return (
                    "I apologize, but I'm having trouble generating a response right now. "
                    "Please try again or use the manual nutrition tools in the app."
                )
            return text

        except (AIServiceUnavailable, AIRequestFailed, AITimeoutError) as e:
            logger.error("Gemini error generating nutrition response: %s", e)
            return (
                "I apologize, but the nutrition assistant is temporarily unavailable. "
                "Please try again later or use the manual nutrition tools in the app."
            )
        except Exception as e:
            logger.error("Error generating nutrition response: %s", e, exc_info=True)
            return (
                "I apologize, but I'm having trouble generating a response right now. "
                "Please try again or use the manual nutrition tools in the app."
            )


# Singleton instance
food_chatbot_service = FoodChatbotService()
