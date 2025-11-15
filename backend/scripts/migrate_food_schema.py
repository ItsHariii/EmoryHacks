#!/usr/bin/env python3
"""
Migration script for updating food and ingredient schema.
This script handles the migration from old schema to new enhanced schema
with ingredients, allergens, and improved safety analysis.
"""

import asyncio
import logging
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import get_db
from app.models.food import Food as FoodModel, FoodSafetyStatus
from app.models.ingredient import Ingredient as IngredientModel
from app.services.unified_food_service import unified_food_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FoodSchemaMigration:
    """Handles migration of food schema and data."""
    
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    def create_backup_tables(self):
        """Create backup tables before migration."""
        logger.info("Creating backup tables...")
        
        with self.engine.connect() as conn:
            # Backup existing foods table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS foods_backup AS 
                SELECT * FROM foods;
            """))
            
            # Backup existing food_logs table if it exists
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS food_logs_backup AS 
                SELECT * FROM food_logs;
            """))
            
            conn.commit()
        
        logger.info("Backup tables created successfully")
    
    def create_enhanced_schema(self):
        """Create the enhanced foods and ingredients tables."""
        logger.info("Creating enhanced schema...")
        
        with self.engine.connect() as conn:
            # Create enhanced foods table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS foods_new (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL,
                    brand VARCHAR,
                    description TEXT,
                    category VARCHAR,
                    serving_size FLOAT,
                    serving_unit VARCHAR DEFAULT 'g',
                    
                    -- Macronutrients
                    calories FLOAT DEFAULT 0,
                    protein FLOAT DEFAULT 0,
                    carbs FLOAT DEFAULT 0,
                    fat FLOAT DEFAULT 0,
                    fiber FLOAT DEFAULT 0,
                    sugar FLOAT DEFAULT 0,
                    sodium FLOAT DEFAULT 0,
                    
                    -- Detailed micronutrients (JSONB)
                    micronutrients JSONB DEFAULT '{}',
                    
                    -- New fields for enhanced functionality
                    ingredients TEXT[] DEFAULT '{}',
                    allergens TEXT[] DEFAULT '{}',
                    
                    -- Safety information
                    safety_status VARCHAR DEFAULT 'safe',
                    safety_notes TEXT,
                    usda_confidence FLOAT,
                    
                    -- API integration
                    source VARCHAR DEFAULT 'manual',
                    spoonacular_id BIGINT,
                    fdc_id BIGINT,
                    
                    -- Verification and metadata
                    is_verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Constraints
                    UNIQUE(spoonacular_id),
                    UNIQUE(fdc_id)
                );
            """))
            
            # Create ingredients table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ingredients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL UNIQUE,
                    description TEXT,
                    category VARCHAR,
                    
                    -- Nutrition per 100g
                    calories FLOAT DEFAULT 0,
                    protein FLOAT DEFAULT 0,
                    carbs FLOAT DEFAULT 0,
                    fat FLOAT DEFAULT 0,
                    fiber FLOAT DEFAULT 0,
                    sugar FLOAT DEFAULT 0,
                    sodium FLOAT DEFAULT 0,
                    
                    -- Detailed micronutrients
                    micronutrients JSONB DEFAULT '{}',
                    
                    -- Allergen information
                    allergens TEXT[] DEFAULT '{}',
                    
                    -- Pregnancy safety
                    safety_status VARCHAR DEFAULT 'safe',
                    safety_notes TEXT,
                    confidence_score FLOAT DEFAULT 0.5,
                    
                    -- Source tracking
                    source VARCHAR DEFAULT 'manual',
                    spoonacular_id BIGINT,
                    fdc_id BIGINT,
                    
                    -- Metadata
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Constraints
                    UNIQUE(spoonacular_id),
                    UNIQUE(fdc_id)
                );
            """))
            
            # Create indexes for performance
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_foods_new_name ON foods_new(name);
                CREATE INDEX IF NOT EXISTS idx_foods_new_brand ON foods_new(brand);
                CREATE INDEX IF NOT EXISTS idx_foods_new_spoonacular_id ON foods_new(spoonacular_id);
                CREATE INDEX IF NOT EXISTS idx_foods_new_fdc_id ON foods_new(fdc_id);
                CREATE INDEX IF NOT EXISTS idx_foods_new_safety_status ON foods_new(safety_status);
                CREATE INDEX IF NOT EXISTS idx_foods_new_updated_at ON foods_new(updated_at);
                
                CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
                CREATE INDEX IF NOT EXISTS idx_ingredients_spoonacular_id ON ingredients(spoonacular_id);
                CREATE INDEX IF NOT EXISTS idx_ingredients_fdc_id ON ingredients(fdc_id);
                CREATE INDEX IF NOT EXISTS idx_ingredients_safety_status ON ingredients(safety_status);
            """))
            
            conn.commit()
        
        logger.info("Enhanced schema created successfully")
    
    async def migrate_existing_data(self):
        """Migrate existing food data to new schema with enhancements."""
        logger.info("Starting data migration...")
        
        db = next(get_db())
        
        try:
            # Get existing foods from backup table
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT * FROM foods_backup"))
                existing_foods = result.fetchall()
            
            logger.info(f"Found {len(existing_foods)} existing foods to migrate")
            
            migrated_count = 0
            enhanced_count = 0
            
            for old_food in existing_foods:
                try:
                    # Use unified service to enhance the food data
                    enhanced_food = await unified_food_service.fetch_food_or_ingredient(
                        query=old_food.name,
                        db=db,
                        force_refresh=True
                    )
                    
                    if enhanced_food:
                        enhanced_count += 1
                        logger.info(f"Enhanced food: {enhanced_food.name}")
                    else:
                        # Fallback: create basic food record
                        basic_food = self._create_basic_food_record(old_food)
                        db.add(basic_food)
                        db.commit()
                        migrated_count += 1
                        logger.info(f"Migrated basic food: {basic_food.name}")
                
                except Exception as e:
                    logger.error(f"Error migrating food '{old_food.name}': {e}")
                    continue
            
            logger.info(f"Migration completed: {enhanced_count} enhanced, {migrated_count} basic migrations")
            
        except Exception as e:
            logger.error(f"Error during data migration: {e}")
            db.rollback()
            raise
        finally:
            db.close()
    
    def _create_basic_food_record(self, old_food) -> FoodModel:
        """Create a basic food record from old schema."""
        food = FoodModel()
        
        # Copy basic fields
        food.name = old_food.name
        food.brand = getattr(old_food, 'brand', None)
        food.description = getattr(old_food, 'description', None)
        food.category = getattr(old_food, 'category', None)
        
        # Copy nutrition
        food.calories = getattr(old_food, 'calories', 0)
        food.protein = getattr(old_food, 'protein', 0)
        food.carbs = getattr(old_food, 'carbs', 0)
        food.fat = getattr(old_food, 'fat', 0)
        food.fiber = getattr(old_food, 'fiber', 0)
        food.sugar = getattr(old_food, 'sugar', 0)
        food.sodium = getattr(old_food, 'sodium', 0)
        
        # Set defaults for new fields
        food.serving_size = 100
        food.serving_unit = 'g'
        food.ingredients = []
        food.allergens = []
        food.safety_status = FoodSafetyStatus.SAFE
        food.safety_notes = "Migrated from old schema - safety not verified"
        food.source = 'migrated'
        
        return food
    
    def finalize_migration(self):
        """Finalize the migration by replacing old tables."""
        logger.info("Finalizing migration...")
        
        with self.engine.connect() as conn:
            # Drop old foods table and rename new one
            conn.execute(text("DROP TABLE IF EXISTS foods CASCADE"))
            conn.execute(text("ALTER TABLE foods_new RENAME TO foods"))
            
            # Update food_logs table to use new foods table structure if needed
            # This would depend on your specific food_logs schema
            
            conn.commit()
        
        logger.info("Migration finalized successfully")
    
    def cleanup_backup_tables(self):
        """Clean up backup tables (optional)."""
        logger.info("Cleaning up backup tables...")
        
        with self.engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS foods_backup"))
            conn.execute(text("DROP TABLE IF EXISTS food_logs_backup"))
            conn.commit()
        
        logger.info("Backup tables cleaned up")
    
    async def run_full_migration(self, cleanup_backups: bool = False):
        """Run the complete migration process."""
        logger.info("Starting full food schema migration...")
        
        try:
            # Step 1: Create backups
            self.create_backup_tables()
            
            # Step 2: Create new schema
            self.create_enhanced_schema()
            
            # Step 3: Migrate and enhance data
            await self.migrate_existing_data()
            
            # Step 4: Finalize migration
            self.finalize_migration()
            
            # Step 5: Optional cleanup
            if cleanup_backups:
                self.cleanup_backup_tables()
            
            logger.info("Food schema migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise

async def main():
    """Main migration function."""
    migration = FoodSchemaMigration()
    
    # Ask for confirmation
    print("This will migrate your food schema and data.")
    print("Backup tables will be created automatically.")
    confirm = input("Do you want to proceed? (y/N): ")
    
    if confirm.lower() != 'y':
        print("Migration cancelled.")
        return
    
    try:
        await migration.run_full_migration(cleanup_backups=False)
        print("Migration completed successfully!")
        print("Backup tables are preserved. You can clean them up later if needed.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        print("Check the logs for more details.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
