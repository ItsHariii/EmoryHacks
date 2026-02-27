"""
Gemini AI Vision service for food photo analysis.

This service uses Google's Gemini AI to analyze food photos and extract:
- Food name
- Estimated portion size
- Ingredients (for safety checks)
"""

import io
import json
import logging
import re
from typing import Dict, Optional

from PIL import Image

from app.schemas.food import FoodPhotoAIAnalysisResult
from app.services.ai_client import (
    vision_gemini_client,
    AIServiceUnavailable,
    AIRequestFailed,
    AITimeoutError,
    extract_text_from_response,
)

logger = logging.getLogger(__name__)


class GeminiVisionService:
    """Service for analyzing food photos using Google Gemini AI."""

    def __init__(self):
        self.client = vision_gemini_client
        logger.info(
            "Initializing GeminiVisionService (configured=%s)", bool(self.client.is_configured)
        )
        if not self.client.is_configured:
            logger.warning(
                "GEMINI_FOOD_API_KEY/GEMINI_API_KEY not set - photo analysis will be disabled"
            )
    
    async def analyze_food_image(
        self, 
        image_data: bytes,
        user_context: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze a food image and extract information.
        
        Args:
            image_data: Raw image bytes
            user_context: Optional user context (trimester, allergies, etc.)
        
        Returns:
            Dict with food identification results
        """
        if not self.client.is_available:
            return {
                "success": False,
                "error": "Gemini AI service not available",
                "error_type": "service_unavailable"
            }
        
        try:
            # Load and validate image
            image = Image.open(io.BytesIO(image_data))
            logger.info(f"Processing image: {image.size}, format: {image.format}")
            
            # Create prompt
            prompt = self._create_analysis_prompt(user_context)

            # Call Gemini API
            response = await self.client.generate_content([prompt, image])
            response_text = extract_text_from_response(response)

            # Parse and validate response
            result = self._parse_response(response_text)

            if result.get("success"):
                logger.info(f"Successfully analyzed food image: {result.get('food_name')} ({result.get('confidence')}% confidence)")
            
            return result
        except (AIServiceUnavailable, AIRequestFailed, AITimeoutError) as e:
            logger.error("Gemini error analyzing food image: %s", e)
            return {
                "success": False,
                "error": "Gemini AI service temporarily unavailable",
                "error_type": "service_unavailable",
            }
        except Exception as e:
            logger.error(f"Error analyzing food image: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "analysis_failed"
            }
    
    def _create_analysis_prompt(self, user_context: Optional[Dict] = None) -> str:
        """Create a detailed prompt for food analysis."""
        base_prompt = """
Analyze this food image and provide detailed information in JSON format.

Your task:
1. Identify the main food item in the image
2. Estimate the portion size in common units (oz, g, cups, pieces, etc.)
3. List all visible ingredients
4. Assess your confidence level (0-100%)

For pregnancy safety, note if the food contains any of these concerns:
- Raw or undercooked items (meat, eggs, fish)
- High mercury fish (tuna, swordfish, shark, king mackerel)
- Unpasteurized dairy or soft cheeses
- Deli meats or hot dogs (unless heated)
- Raw sprouts
- Alcohol or high caffeine

Return ONLY valid JSON in this exact format:
{
  "food_name": "Primary food name (simple, searchable name like 'grilled chicken breast' or 'apple')",
  "portion_size": 6,
  "portion_unit": "oz",
  "ingredients": ["ingredient1", "ingredient2"],
  "confidence": 85,
  "pregnancy_concerns": ["concern1", "concern2"] or []
}

Important:
- Keep food_name simple and searchable (e.g., "salmon" not "beautifully plated salmon with garnish")
- Be realistic with portion_size estimates
- Only list pregnancy_concerns if you see clear risk factors
- confidence should reflect how certain you are about the identification
"""
        
        if user_context:
            trimester = user_context.get('trimester')
            if trimester:
                base_prompt += f"\n\nNote: User is in trimester {trimester} of pregnancy."
        
        return base_prompt
    
    def _parse_response(self, response_text: str) -> Dict:
        """Parse Gemini response into structured, validated data."""
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON object directly
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                json_str = json_match.group(0) if json_match else response_text

            raw_data = json.loads(json_str)

            # Validate and normalize using Pydantic schema
            validated = FoodPhotoAIAnalysisResult.model_validate(raw_data)
            data = validated.model_dump()
            data["success"] = True

            return data

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return {
                "success": False,
                "error": "Failed to parse AI response",
                "error_type": "parse_error",
                "raw_response": response_text[:500]  # First 500 chars for debugging
            }
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return {
                "success": False,
                "error": f"Response parsing failed: {str(e)}",
                "error_type": "parse_error",
                "raw_response": response_text[:500]
            }


# Singleton instance
gemini_vision_service = GeminiVisionService()
