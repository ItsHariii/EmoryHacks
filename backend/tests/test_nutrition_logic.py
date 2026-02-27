import pytest
from datetime import date, timedelta
from app.api.users import get_nutrition_targets
from app.models.user import User

class MockUser:
    def __init__(self, pre_pregnancy_weight, height, birth_date=None, trimester=1, babies=1):
        self.pre_pregnancy_weight = pre_pregnancy_weight
        self.height = height
        self.birth_date = birth_date
        self.trimester = trimester
        self.babies = babies

@pytest.mark.asyncio
async def test_nutrition_targets_default_age():
    # Test with no birth_date (should default to age 30)
    # BMR = 10 * 60 + 6.25 * 165 - 5 * 30 - 161
    # BMR = 600 + 1031.25 - 150 - 161 = 1320.25
    # Calories = 1320.25 * 1.5 = 1980.375 -> 1980
    
    user = MockUser(pre_pregnancy_weight=60, height=165, birth_date=None)
    targets = await get_nutrition_targets(current_user=user)
    
    assert targets["calories"] == 1980

@pytest.mark.asyncio
async def test_nutrition_targets_with_birth_date():
    # Test with birth_date (e.g., 25 years old)
    today = date.today()
    birth_date = date(today.year - 25, today.month, today.day)
    
    # BMR = 10 * 60 + 6.25 * 165 - 5 * 25 - 161
    # BMR = 600 + 1031.25 - 125 - 161 = 1345.25
    # Calories = 1345.25 * 1.5 = 2017.875 -> 2018
    
    user = MockUser(pre_pregnancy_weight=60, height=165, birth_date=birth_date)
    targets = await get_nutrition_targets(current_user=user)
    
    assert targets["calories"] == 2018

@pytest.mark.asyncio
async def test_nutrition_targets_trimester_adjustment():
    # Test trimester 2 (+340)
    # Base (age 30) = 1980
    # Total = 1980 + 340 = 2320
    
    user = MockUser(pre_pregnancy_weight=60, height=165, trimester=2)
    targets = await get_nutrition_targets(current_user=user)
    
    assert targets["calories"] == 2320
