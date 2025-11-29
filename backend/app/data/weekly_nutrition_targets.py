"""
Week-by-week nutrition targets for pregnancy based on BMI category.
Implements gradual calorie increases to avoid big jumps between trimesters.

Based on evidence-based research from NIH, CDC, ACOG guidelines.
All values are personalized by pre-pregnancy BMI category.
"""

from typing import Dict, Literal, TypedDict
from enum import Enum


class BMICategory(str, Enum):
    """Pre-pregnancy BMI categories"""
    UNDERWEIGHT = "underweight"  # BMI < 18.5
    NORMAL = "normal"  # BMI 18.5-24.9
    OVERWEIGHT = "overweight"  # BMI 25-29.9
    OBESE = "obese"  # BMI >= 30


class WeeklyNutrition(TypedDict):
    """Nutrition targets for a specific week"""
    week: int
    trimester: int
    calories: int
    protein_g: float  # grams
    carbs_g: float  # grams
    fat_g: float  # grams
    fiber_g: float  # grams
    water_ml: int  # milliliters
    # Micronutrients
    iron_mg: float
    folate_mcg: float
    calcium_mg: float
    vitamin_d_iu: float
    iodine_mcg: float
    zinc_mg: float
    vitamin_b12_mcg: float
    magnesium_mg: float
    choline_mg: float
    omega3_dha_mg: float
    omega3_epa_mg: float


def calculate_macros(calories: int) -> Dict[str, float]:
    """
    Calculate macronutrient targets based on calorie intake.
    
    Macronutrient distribution:
    - Protein: 20-25% of calories (using 22.5% average)
    - Carbohydrates: 45-65% of calories (using 50% average)
    - Fat: 25-35% of calories (using 27.5% average)
    """
    protein_g = (calories * 0.225) / 4  # 4 cal/g protein
    carbs_g = (calories * 0.50) / 4  # 4 cal/g carbs
    fat_g = (calories * 0.275) / 9  # 9 cal/g fat
    
    # Ensure minimum requirements
    protein_g = max(protein_g, 60)  # Minimum 60g protein
    carbs_g = max(carbs_g, 175)  # Minimum 175g carbs
    
    return {
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1)
    }


def get_micronutrient_targets(week: int) -> Dict[str, float]:
    """
    Get micronutrient targets. Most remain constant, but some increase in 3rd trimester.
    
    Args:
        week: Pregnancy week (1-40)
    
    Returns:
        Dictionary of micronutrient targets
    """
    # Base micronutrient targets (constant throughout pregnancy)
    targets = {
        "iron_mg": 27.0,
        "folate_mcg": 600.0,
        "calcium_mg": 1000.0,
        "vitamin_d_iu": 600.0,
        "iodine_mcg": 220.0,
        "zinc_mg": 11.0,
        "vitamin_b12_mcg": 2.6,
        "magnesium_mg": 350.0,
        "fiber_g": 28.0,
    }
    
    # Choline increases in 3rd trimester (week 28+)
    if week >= 28:
        targets["choline_mg"] = 930.0  # Research-supported higher intake
    else:
        targets["choline_mg"] = 450.0  # Standard RDA
    
    # Omega-3 targets (constant)
    targets["omega3_dha_mg"] = 300.0  # Optimal 300-400mg
    targets["omega3_epa_mg"] = 100.0
    
    return targets


def generate_weekly_targets(bmi_category: BMICategory) -> Dict[int, WeeklyNutrition]:
    """
    Generate week-by-week nutrition targets with gradual increases.
    
    Implements smooth calorie increases to avoid big jumps between trimesters:
    - First trimester (weeks 1-13): Baseline calories
    - Second trimester (weeks 14-27): Gradual increase
    - Third trimester (weeks 28-40): Further gradual increase
    
    Args:
        bmi_category: Pre-pregnancy BMI category
    
    Returns:
        Dictionary mapping week number (1-40) to nutrition targets
    """
    # Define baseline calories and increases by BMI category
    if bmi_category == BMICategory.UNDERWEIGHT:
        baseline = 2300  # Average of 2200-2400
        t2_total_increase = 400  # Second trimester total increase
        t3_total_increase = 500  # Third trimester additional increase (avg of 400-600)
        
    elif bmi_category == BMICategory.NORMAL:
        baseline = 2100  # Average of 2000-2200
        t2_total_increase = 345  # Average of 340-350
        t3_total_increase = 450
        
    elif bmi_category == BMICategory.OVERWEIGHT:
        baseline = 1900  # Average of 1800-2000
        t2_total_increase = 200
        t3_total_increase = 400
        
    else:  # OBESE
        baseline = 1750  # Average of 1600-1900
        t2_total_increase = 100  # Average of 0-200
        t3_total_increase = 300  # Average of 200-400
    
    # Calculate weekly increases for smooth transitions
    # Second trimester: 14 weeks (weeks 14-27)
    # Third trimester: 13 weeks (weeks 28-40)
    t2_weekly_increase = t2_total_increase / 14
    t3_weekly_increase = t3_total_increase / 13
    
    weekly_targets: Dict[int, WeeklyNutrition] = {}
    
    for week in range(1, 41):  # Weeks 1-40
        # Determine trimester
        if week <= 13:
            trimester = 1
            calories = baseline
        elif week <= 27:
            trimester = 2
            # Gradual increase from week 14
            weeks_into_t2 = week - 13
            calories = baseline + int(t2_weekly_increase * weeks_into_t2)
        else:
            trimester = 3
            # Start from end of T2, add gradual T3 increase
            t2_total = baseline + t2_total_increase
            weeks_into_t3 = week - 27
            calories = t2_total + int(t3_weekly_increase * weeks_into_t3)
        
        # Calculate macros based on calories
        macros = calculate_macros(calories)
        
        # Get micronutrient targets
        micros = get_micronutrient_targets(week)
        
        # Water intake increases gradually (2.3-3.0L recommended, using 2.7L average = 2700ml)
        # Slight increase in T3 due to increased blood volume
        if trimester == 1:
            water_ml = 2500
        elif trimester == 2:
            water_ml = 2700
        else:  # trimester 3
            water_ml = 2900
        
        weekly_targets[week] = WeeklyNutrition(
            week=week,
            trimester=trimester,
            calories=calories,
            protein_g=macros["protein_g"],
            carbs_g=macros["carbs_g"],
            fat_g=macros["fat_g"],
            fiber_g=micros["fiber_g"],
            water_ml=water_ml,
            iron_mg=micros["iron_mg"],
            folate_mcg=micros["folate_mcg"],
            calcium_mg=micros["calcium_mg"],
            vitamin_d_iu=micros["vitamin_d_iu"],
            iodine_mcg=micros["iodine_mcg"],
            zinc_mg=micros["zinc_mg"],
            vitamin_b12_mcg=micros["vitamin_b12_mcg"],
            magnesium_mg=micros["magnesium_mg"],
            choline_mg=micros["choline_mg"],
            omega3_dha_mg=micros["omega3_dha_mg"],
            omega3_epa_mg=micros["omega3_epa_mg"],
        )
    
    return weekly_targets


def get_nutrition_targets(week: int, bmi_category: BMICategory) -> WeeklyNutrition:
    """
    Get nutrition targets for a specific week and BMI category.
    
    Args:
        week: Pregnancy week (1-40)
        bmi_category: Pre-pregnancy BMI category
    
    Returns:
        Nutrition targets for the specified week
    
    Raises:
        ValueError: If week is not between 1 and 40
    """
    if not 1 <= week <= 40:
        raise ValueError(f"Week must be between 1 and 40, got {week}")
    
    targets = generate_weekly_targets(bmi_category)
    return targets[week]


def get_bmi_category(bmi: float) -> BMICategory:
    """
    Determine BMI category from BMI value.
    
    Args:
        bmi: Body Mass Index value
    
    Returns:
        BMI category enum
    """
    if bmi < 18.5:
        return BMICategory.UNDERWEIGHT
    elif bmi < 25:
        return BMICategory.NORMAL
    elif bmi < 30:
        return BMICategory.OVERWEIGHT
    else:
        return BMICategory.OBESE


# Pre-generate all targets for quick lookup
NUTRITION_TARGETS = {
    BMICategory.UNDERWEIGHT: generate_weekly_targets(BMICategory.UNDERWEIGHT),
    BMICategory.NORMAL: generate_weekly_targets(BMICategory.NORMAL),
    BMICategory.OVERWEIGHT: generate_weekly_targets(BMICategory.OVERWEIGHT),
    BMICategory.OBESE: generate_weekly_targets(BMICategory.OBESE),
}


def get_targets_for_user(week: int, bmi: float) -> WeeklyNutrition:
    """
    Convenience function to get nutrition targets based on week and BMI.
    
    Args:
        week: Pregnancy week (1-40)
        bmi: User's pre-pregnancy BMI
    
    Returns:
        Nutrition targets for the specified week and BMI
    """
    category = get_bmi_category(bmi)
    return NUTRITION_TARGETS[category][week]


# Example usage and testing
if __name__ == "__main__":
    # Example: Normal BMI woman at week 20
    targets = get_targets_for_user(week=20, bmi=22.5)
    print(f"Week 20 targets for Normal BMI:")
    print(f"  Calories: {targets['calories']} kcal")
    print(f"  Protein: {targets['protein_g']}g")
    print(f"  Carbs: {targets['carbs_g']}g")
    print(f"  Fat: {targets['fat_g']}g")
    print(f"  Water: {targets['water_ml']}ml")
    print(f"  Iron: {targets['iron_mg']}mg")
    print(f"  Folate: {targets['folate_mcg']}mcg")
    print(f"  Choline: {targets['choline_mg']}mg")
    
    # Show calorie progression for Normal BMI
    print("\n\nCalorie progression for Normal BMI:")
    print("Week | Trimester | Calories")
    print("-" * 30)
    for week in [1, 7, 13, 14, 20, 27, 28, 34, 40]:
        t = NUTRITION_TARGETS[BMICategory.NORMAL][week]
        print(f"{week:4d} | T{t['trimester']}        | {t['calories']} kcal")
