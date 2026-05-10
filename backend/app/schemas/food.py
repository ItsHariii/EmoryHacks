from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union, Literal
from datetime import datetime, date
from enum import Enum

from .base import BaseSchema

# Allowed serving units. Keep aligned with NutritionCalculatorService.UNIT_CONVERSIONS;
# unknown units used to silently coerce to grams which corrupted logged calories.
ServingUnit = Literal[
    "g", "ml", "cup", "tbsp", "tsp", "oz", "lb", "serving"
]

class FoodSafetyStatus(str, Enum):
    SAFE = "safe"
    LIMITED = "limited"
    AVOID = "avoid"


class CitedSource(BaseModel):
    """Authoritative source backing a safety rule (FDA / CDC / ACOG / NHS / WHO)."""
    id: str
    label: str
    url: Optional[str] = None
    last_reviewed: Optional[str] = None


class AmountLimit(BaseModel):
    """Daily/weekly intake cap for a rule (e.g., caffeine 200mg/day)."""
    amount: float
    unit: str
    period: str  # "day" | "week"


class IngredientFinding(BaseModel):
    """Per-ingredient match the safety pipeline produced."""
    ingredient: str
    status: FoodSafetyStatus
    notes: str
    matched_pattern: Optional[str] = None
    matched_layer: Literal["exact", "prefix", "token", "category", "fuzzy", "default"]
    category: Optional[str] = None
    source: Optional[CitedSource] = None
    confidence: float = 0.0
    amount_limit: Optional[AmountLimit] = None


class SafetyVerdict(BaseModel):
    """Layered safety pipeline output for a food/ingredient set."""
    status: FoodSafetyStatus
    confidence: float = 0.0
    summary: str
    ingredient_findings: List[IngredientFinding] = Field(default_factory=list)
    cited_sources: List[CitedSource] = Field(default_factory=list)
    trimester: Optional[Literal["all", "t1", "t2", "t3"]] = None
    trimester_specific: bool = False
    amount_guidance: Optional[AmountLimit] = None
    reviewed_by_human: bool = True


class AllergenHit(BaseModel):
    """User-allergy ↔ food-allergen overlap."""
    allergen: str
    matched_in: Literal["allergens", "ingredients", "name"]
    severity: Literal["warn", "block"] = "warn"

class NutrientBase(BaseModel):
    name: str
    amount: float
    unit: str
    percent_daily_value: Optional[float] = None

class FoodBase(BaseSchema):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    serving_size: float = Field(..., gt=0, description="Serving size in grams")
    serving_unit: str = Field(..., description="Unit of measurement (g, ml, oz, etc.)")
    calories: float = Field(..., ge=0, description="Calories per serving")
    nutrients: Dict[str, Dict[str, Any]] = Field(..., description="Nutrients in the food")
    safety_status: FoodSafetyStatus = FoodSafetyStatus.SAFE
    safety_notes: Optional[str] = None
    fdc_id: Optional[str] = Field(None, description="USDA FoodData Central ID")

class FoodCreate(FoodBase):
    pass

class FoodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    serving_size: Optional[float] = None
    serving_unit: Optional[str] = None
    calories: Optional[float] = None
    nutrients: Optional[Dict[str, Dict[str, Any]]] = None
    safety_status: Optional[FoodSafetyStatus] = None
    safety_notes: Optional[str] = None
    fdc_id: Optional[str] = None

from uuid import UUID as UUIDType

class FoodResponse(FoodBase):
    id: Union[str, UUIDType]
    created_at: datetime
    updated_at: datetime
    safety_verdict: Optional[SafetyVerdict] = None
    allergen_hits: List[AllergenHit] = Field(default_factory=list)

class FoodSearchResult(BaseSchema):
    id: str
    name: str
    brand: Optional[str] = None
    serving_size: Optional[float] = 100.0
    serving_unit: Optional[str] = "g"
    calories: Optional[float] = 0.0
    safety_status: FoodSafetyStatus = FoodSafetyStatus.LIMITED
    safety_notes: Optional[str] = None
    safety_verdict: Optional[SafetyVerdict] = None
    allergen_hits: List[AllergenHit] = Field(default_factory=list)

    # Macronutrients
    protein: Optional[float] = 0.0
    carbs: Optional[float] = 0.0
    fat: Optional[float] = 0.0
    fiber: Optional[float] = 0.0
    sugar: Optional[float] = 0.0
    sodium: Optional[float] = 0.0

    # Micronutrients (detailed nutrition data)
    micronutrients: Optional[Dict[str, Any]] = {}

    # Source information
    source: Optional[str] = "manual"
    item_type: str = "food"  # "food" or "ingredient"

class FoodLogBase(BaseSchema):
    food_id: str
    serving_size: float = Field(..., gt=0, description="Amount consumed (e.g., 1.5)")
    serving_unit: ServingUnit = Field(..., description="Unit of serving")
    consumed_at: datetime = Field(default_factory=datetime.utcnow)
    meal_type: Optional[str] = Field(
        None,
        description="Type of meal (breakfast, lunch, dinner, snack)",
        pattern="^(breakfast|lunch|dinner|snack)$"
    )
    notes: Optional[str] = None

class FoodLogCreate(FoodLogBase):
    pass

class FoodLogUpdate(BaseModel):
    serving_size: Optional[float] = Field(default=None, gt=0)
    serving_unit: Optional[ServingUnit] = None
    quantity: Optional[float] = Field(default=None, gt=0)
    consumed_at: Optional[datetime] = None
    meal_type: Optional[str] = Field(
        default=None,
        pattern="^(breakfast|lunch|dinner|snack)$",
    )
    notes: Optional[str] = None

class FoodLogResponse(FoodLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    food: FoodResponse
    quantity: float = 1.0
    
    # Computed fields for clarity
    total_amount: Optional[float] = None
    total_unit: Optional[str] = None
    
    # Calculated nutrition fields
    calories_logged: float = 0.0
    nutrients_logged: Optional[Dict[str, float]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DailyNutrition(BaseSchema):
    date: date
    total_calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    fiber_g: float = 0.0
    sugar_g: float = 0.0
    sodium_mg: float = 0.0
    calcium_mg: float = 0.0
    iron_mg: float = 0.0
    vitamin_a_mcg: float = 0.0
    vitamin_c_mg: float = 0.0
    vitamin_d_mcg: float = 0.0
    folate_mcg: float = 0.0
    magnesium_mg: float = 0.0
    zinc_mg: float = 0.0
    potassium_mg: float = 0.0
    choline_mg: float = 0.0
    dha_mg: float = 0.0
    omega3_mg: float = 0.0

    # Maps the keys actually stored on Food.micronutrients (USDA / Spoonacular
    # both store lower().replace(' ', '_') form, which leaves commas in place)
    # to our canonical aggregation field. USDA returns nutrients in their
    # native unit (mg/mcg/g) so no unit conversion is applied.
    _NUTRIENT_FIELD_MAP = {
        # macros — covered explicitly via food.protein/carbs/fat/fiber/sugar
        # micros: USDA "lower replace space underscore" form
        'sodium,_na': 'sodium_mg',
        'calcium,_ca': 'calcium_mg',
        'iron,_fe': 'iron_mg',
        'magnesium,_mg': 'magnesium_mg',
        'zinc,_zn': 'zinc_mg',
        'potassium,_k': 'potassium_mg',
        'vitamin_a,_rae': 'vitamin_a_mcg',
        'vitamin_c,_total_ascorbic_acid': 'vitamin_c_mg',
        'vitamin_d_(d2_+_d3)': 'vitamin_d_mcg',
        'folate,_total': 'folate_mcg',
        'folate,_dfe': 'folate_mcg',
        'choline,_total': 'choline_mg',
        # Spoonacular / canonical aliases (already-normalized form)
        'sodium': 'sodium_mg',
        'calcium': 'calcium_mg',
        'iron': 'iron_mg',
        'magnesium': 'magnesium_mg',
        'zinc': 'zinc_mg',
        'potassium': 'potassium_mg',
        'vitamin_a': 'vitamin_a_mcg',
        'vitamin_c': 'vitamin_c_mg',
        'vitamin_d': 'vitamin_d_mcg',
        'folate': 'folate_mcg',
        'choline': 'choline_mg',
    }

    # USDA carries DHA inside the polyunsaturated fatty acid family — match by
    # substring rather than exact key.
    _DHA_KEY_HINTS = ('22:6', 'dha')
    _OMEGA3_KEY_HINTS = ('n-3', 'omega-3', 'omega_3')

    def add_food(self, food: 'Food', quantity: float = 1.0):
        """Add nutrition information from a food item to the daily total.

        `food` is the SQLAlchemy Food row. Macros come from explicit columns;
        micros come from the JSONB `micronutrients` map. `quantity` is the
        FoodLog.quantity (currently always 1.0 — serving_size already represents
        the consumed amount, see logging.log_food).
        """
        self.total_calories += (food.calories or 0) * quantity
        self.protein_g += (food.protein or 0) * quantity
        self.carbs_g += (food.carbs or 0) * quantity
        self.fat_g += (food.fat or 0) * quantity
        self.fiber_g += (food.fiber or 0) * quantity
        self.sugar_g += (food.sugar or 0) * quantity

        micros = food.micronutrients or {}
        for raw_key, nutrient in micros.items():
            if not isinstance(nutrient, dict):
                continue
            amount = nutrient.get('amount')
            if amount is None:
                continue
            key = raw_key.lower()
            field = self._NUTRIENT_FIELD_MAP.get(key)
            if field is None:
                if any(hint in key for hint in self._DHA_KEY_HINTS):
                    field = 'dha_mg'
                elif any(hint in key for hint in self._OMEGA3_KEY_HINTS):
                    field = 'omega3_mg'
                else:
                    continue
            setattr(self, field, getattr(self, field, 0) + amount * quantity)


class FoodPhotoAIAnalysisResult(BaseModel):
    """
    Schema for normalized AI output from food photo analysis (Gemini Vision).

    This is intentionally focused on the AI's perception of the image, not the
    final USDA/DB-backed `Food` model.
    """

    food_name: str = Field(..., min_length=1, description="Primary, searchable food name")
    portion_size: Optional[float] = Field(
        default=None,
        ge=0,
        description="Estimated portion size (numeric)",
    )
    portion_unit: Optional[str] = Field(
        default="g",
        description="Unit for portion size (e.g. g, oz, cup)",
    )
    ingredients: List[str] = Field(
        default_factory=list,
        description="List of visible or inferred ingredients",
    )
    confidence: float = Field(
        ...,
        ge=0,
        le=100,
        description="Model confidence in identification (0-100)",
    )
    pregnancy_concerns: List[str] = Field(
        default_factory=list,
        description="High-level pregnancy safety concerns detected by the model",
    )
