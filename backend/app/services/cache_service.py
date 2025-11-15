import logging
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from ..models.food import Food as FoodModel

logger = logging.getLogger(__name__)

class CacheService:
    """
    Service for caching and deduplication of food data.
    Handles intelligent caching, duplicate detection, and cache invalidation.
    """
    
    def __init__(self):
        # Cache TTL settings (in hours)
        self.cache_ttl = {
            "spoonacular": 24 * 7,  # 1 week for Spoonacular data
            "usda": 24 * 30,        # 1 month for USDA data
            "local": 24 * 3         # 3 days for local modifications
        }
    
    def generate_food_hash(self, name: str, brand: Optional[str] = None, serving_size: Optional[float] = None) -> str:
        """Generate a unique hash for food identification."""
        # Normalize inputs
        name_norm = name.lower().strip()
        brand_norm = (brand or "").lower().strip()
        serving_norm = str(serving_size or 100)
        
        # Create hash string
        hash_string = f"{name_norm}|{brand_norm}|{serving_norm}"
        return hashlib.md5(hash_string.encode()).hexdigest()
    
    def find_duplicates(self, db: Session, name: str, brand: Optional[str] = None, 
                       spoonacular_id: Optional[str] = None, fdc_id: Optional[str] = None) -> List[FoodModel]:
        """
        Find potential duplicate foods in the database.
        Uses multiple strategies for duplicate detection.
        """
        duplicates = []
        
        # Strategy 1: Exact API ID match
        if spoonacular_id:
            spoon_match = db.query(FoodModel).filter(FoodModel.spoonacular_id == spoonacular_id).first()
            if spoon_match:
                duplicates.append(spoon_match)
        
        if fdc_id:
            usda_match = db.query(FoodModel).filter(FoodModel.fdc_id == fdc_id).first()
            if usda_match:
                duplicates.append(usda_match)
        
        # Strategy 2: Exact name and brand match
        if brand:
            exact_match = db.query(FoodModel).filter(
                and_(
                    func.lower(FoodModel.name) == name.lower(),
                    func.lower(FoodModel.brand) == brand.lower()
                )
            ).first()
            if exact_match and exact_match not in duplicates:
                duplicates.append(exact_match)
        
        # Strategy 3: Fuzzy name matching (for foods without brand)
        if not duplicates:
            name_matches = db.query(FoodModel).filter(
                or_(
                    func.lower(FoodModel.name) == name.lower(),
                    FoodModel.name.ilike(f"%{name}%")
                )
            ).limit(5).all()
            
            # Score matches by similarity
            for match in name_matches:
                if match not in duplicates:
                    similarity = self._calculate_similarity(name, match.name, brand, match.brand)
                    if similarity > 0.8:  # High similarity threshold
                        duplicates.append(match)
        
        return duplicates
    
    def _calculate_similarity(self, name1: str, name2: str, brand1: Optional[str], brand2: Optional[str]) -> float:
        """Calculate similarity score between two food items."""
        # Simple similarity calculation
        name_sim = self._string_similarity(name1.lower(), name2.lower())
        
        if brand1 and brand2:
            brand_sim = self._string_similarity(brand1.lower(), brand2.lower())
            return (name_sim * 0.7) + (brand_sim * 0.3)
        
        return name_sim
    
    def _string_similarity(self, s1: str, s2: str) -> float:
        """Calculate string similarity using simple character overlap."""
        if not s1 or not s2:
            return 0.0
        
        # Simple Jaccard similarity
        set1 = set(s1.split())
        set2 = set(s2.split())
        
        if not set1 and not set2:
            return 1.0
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union if union > 0 else 0.0
    
    def is_cache_valid(self, food: FoodModel) -> bool:
        """Check if cached food data is still valid."""
        if not food.updated_at:
            return False
        
        # Determine TTL based on source
        source = food.source or "local"
        ttl_hours = self.cache_ttl.get(source, self.cache_ttl["local"])
        
        expiry_time = food.updated_at + timedelta(hours=ttl_hours)
        return datetime.utcnow() < expiry_time
    
    def get_cached_food(self, db: Session, query: str, spoonacular_id: Optional[str] = None, 
                       fdc_id: Optional[str] = None) -> Optional[FoodModel]:
        """
        Get cached food with validation.
        Returns None if cache is invalid or not found.
        """
        # Try exact API ID matches first
        if spoonacular_id:
            food = db.query(FoodModel).filter(FoodModel.spoonacular_id == spoonacular_id).first()
            if food and self.is_cache_valid(food):
                logger.info(f"Cache hit for Spoonacular ID {spoonacular_id}: {food.name}")
                return food
        
        if fdc_id:
            food = db.query(FoodModel).filter(FoodModel.fdc_id == fdc_id).first()
            if food and self.is_cache_valid(food):
                logger.info(f"Cache hit for USDA FDC ID {fdc_id}: {food.name}")
                return food
        
        # Try name-based search
        foods = db.query(FoodModel).filter(
            or_(
                func.lower(FoodModel.name) == query.lower(),
                FoodModel.name.ilike(f"%{query}%")
            )
        ).order_by(FoodModel.updated_at.desc()).limit(3).all()
        
        for food in foods:
            if self.is_cache_valid(food):
                similarity = self._string_similarity(query.lower(), food.name.lower())
                if similarity > 0.7:  # Good similarity match
                    logger.info(f"Cache hit for query '{query}': {food.name} (similarity: {similarity:.2f})")
                    return food
        
        logger.info(f"Cache miss for query '{query}'")
        return None
    
    def cache_food(self, db: Session, food: FoodModel, merge_duplicates: bool = True) -> FoodModel:
        """
        Cache food with duplicate handling.
        
        Args:
            db: Database session
            food: Food object to cache
            merge_duplicates: Whether to merge with existing duplicates
            
        Returns:
            The cached food object (may be merged with existing)
        """
        try:
            # Find potential duplicates
            duplicates = self.find_duplicates(
                db=db,
                name=food.name,
                brand=food.brand,
                spoonacular_id=food.spoonacular_id,
                fdc_id=food.fdc_id
            )
            
            if duplicates and merge_duplicates:
                # Merge with the best duplicate
                existing = duplicates[0]
                merged = self._merge_food_data(existing, food)
                
                # Update the existing record
                for key, value in merged.items():
                    if hasattr(existing, key) and value is not None:
                        setattr(existing, key, value)
                
                existing.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing)
                
                logger.info(f"Merged food data for '{food.name}' with existing record")
                return existing
            
            # No duplicates or merge disabled - create new record
            food.updated_at = datetime.utcnow()
            db.add(food)
            db.commit()
            db.refresh(food)
            
            logger.info(f"Cached new food: '{food.name}' from source: {food.source}")
            return food
            
        except Exception as e:
            logger.error(f"Error caching food '{food.name}': {e}")
            db.rollback()
            raise
    
    def _merge_food_data(self, existing: FoodModel, new: FoodModel) -> Dict[str, Any]:
        """
        Merge food data intelligently, preferring more complete and recent data.
        
        Returns:
            Dictionary of merged field values
        """
        merged = {}
        
        # Merge strategy: prefer non-null, more recent, or more complete data
        merge_fields = [
            'name', 'brand', 'description', 'category', 'serving_size', 'serving_unit',
            'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium',
            'micronutrients', 'ingredients', 'allergens', 'safety_status', 'safety_notes'
        ]
        
        for field in merge_fields:
            existing_val = getattr(existing, field, None)
            new_val = getattr(new, field, None)
            
            # Prefer new non-null values
            if new_val is not None and existing_val is None:
                merged[field] = new_val
            # For lists/arrays, merge them
            elif field in ['ingredients', 'allergens'] and isinstance(new_val, list) and isinstance(existing_val, list):
                # Merge and deduplicate lists
                combined = list(set((existing_val or []) + (new_val or [])))
                merged[field] = combined
            # For micronutrients (dict), merge them
            elif field == 'micronutrients' and isinstance(new_val, dict) and isinstance(existing_val, dict):
                merged_nutrients = (existing_val or {}).copy()
                merged_nutrients.update(new_val or {})
                merged[field] = merged_nutrients
            # Prefer more recent safety information
            elif field in ['safety_status', 'safety_notes'] and new_val is not None:
                merged[field] = new_val
        
        # Always update API IDs if available
        if new.spoonacular_id and not existing.spoonacular_id:
            merged['spoonacular_id'] = new.spoonacular_id
        if new.fdc_id and not existing.fdc_id:
            merged['fdc_id'] = new.fdc_id
        
        return merged
    
    def invalidate_cache(self, db: Session, food_id: Optional[str] = None, 
                        source: Optional[str] = None, older_than_hours: Optional[int] = None):
        """
        Invalidate cached food data based on various criteria.
        
        Args:
            db: Database session
            food_id: Specific food ID to invalidate
            source: Invalidate all foods from specific source
            older_than_hours: Invalidate foods older than specified hours
        """
        try:
            query = db.query(FoodModel)
            
            if food_id:
                query = query.filter(FoodModel.id == food_id)
            
            if source:
                query = query.filter(FoodModel.source == source)
            
            if older_than_hours:
                cutoff_time = datetime.utcnow() - timedelta(hours=older_than_hours)
                query = query.filter(FoodModel.updated_at < cutoff_time)
            
            # Mark as needing refresh (could add a flag) or delete
            foods_to_invalidate = query.all()
            
            for food in foods_to_invalidate:
                # For now, we'll just update the timestamp to force refresh
                food.updated_at = datetime.utcnow() - timedelta(days=365)  # Force expiry
            
            db.commit()
            logger.info(f"Invalidated {len(foods_to_invalidate)} cached foods")
            
        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")
            db.rollback()
    
    def get_cache_stats(self, db: Session) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        try:
            total_foods = db.query(FoodModel).count()
            
            # Count by source
            source_counts = {}
            for source in ['spoonacular', 'usda', 'local']:
                count = db.query(FoodModel).filter(FoodModel.source == source).count()
                source_counts[source] = count
            
            # Count valid vs expired
            valid_count = 0
            expired_count = 0
            
            all_foods = db.query(FoodModel).all()
            for food in all_foods:
                if self.is_cache_valid(food):
                    valid_count += 1
                else:
                    expired_count += 1
            
            return {
                "total_foods": total_foods,
                "by_source": source_counts,
                "valid_cache": valid_count,
                "expired_cache": expired_count,
                "cache_hit_rate": valid_count / total_foods if total_foods > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}

# Create singleton instance
cache_service = CacheService()
