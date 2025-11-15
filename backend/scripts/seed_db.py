import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import session_scope, Base, engine
from app.models.user import User
from app.models.food import Food, FoodLog, FoodSafetyStatus

def create_test_data():
    try:
        with session_scope() as db:
            # Create test user
            test_user = User(
                id=uuid4(),
                email="test@example.com",
                password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # hashed "test1234"
                first_name="Test",
                last_name="User",
                due_date=datetime.now().date() + timedelta(days=120),  # 4 months from now
                babies=1,
                pre_pregnancy_weight=65.0,
                height=165.0,
                current_weight=70.0,
                blood_type="A+",
                allergies=["peanuts"],
                conditions=[],
                dietary_preferences="vegetarian",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Create test foods
            test_food1 = Food(
                id=uuid4(),
                name="Organic Banana",
                description="Fresh organic banana",
                category="Fruit",
                serving_size=1.0,
                serving_unit="medium (118g)",
                calories=105.0,
                nutrients={
                    "protein": 1.3,
                    "carbs": 27.0,
                    "fiber": 3.1,
                    "sugar": 14.4,
                    "fat": 0.4,
                    "vitamin_c": 17.0,
                    "potassium": 422.0
                },
                safety_status=FoodSafetyStatus.SAFE,
                safety_notes="Excellent source of potassium and safe during pregnancy.",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            test_food2 = Food(
                id=uuid4(),
                name="Salmon Fillet",
                description="Wild-caught salmon",
                category="Seafood",
                serving_size=100.0,
                serving_unit="grams",
                calories=208.0,
                nutrients={
                    "protein": 20.0,
                    "carbs": 0.0,
                    "fiber": 0.0,
                    "sugar": 0.0,
                    "fat": 13.0,
                    "omega3": 2.3,
                    "vitamin_d": 14.9
                },
                safety_status=FoodSafetyStatus.LIMITED,
                safety_notes="Limit to 2-3 servings per week due to mercury content.",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Add objects to session
            db.add(test_user)
            db.add(test_food1)
            db.add(test_food2)
            
            # Create food log entries
            food_log1 = FoodLog(
                id=uuid4(),
                user_id=test_user.id,
                food_id=test_food1.id,
                quantity=1.0,
                consumed_at=datetime.now() - timedelta(hours=2),
                meal_type="Breakfast",
                notes="Had with oatmeal"
            )
            
            food_log2 = FoodLog(
                id=uuid4(),
                user_id=test_user.id,
                food_id=test_food2.id,
                quantity=150.0,  # 150g
                consumed_at=datetime.now() - timedelta(hours=6),
                meal_type="Lunch",
                notes="Grilled with vegetables"
            )
            
            db.add(food_log1)
            db.add(food_log2)
            
            # Commit happens automatically with session_scope
            print("✅ Test data created successfully!")
            print(f"- User: {test_user.email}")
            print(f"- Foods: {test_food1.name}, {test_food2.name}")
            print(f"- Food logs: {food_log1.id}, {food_log2.id}")
    except Exception as e:
        print(f"❌ Error creating test data: {str(e)}")
        raise

if __name__ == "__main__":
    print("🌱 Seeding database with test data...")
    create_test_data()
