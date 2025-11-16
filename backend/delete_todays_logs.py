"""
Delete today's food logs so we can create fresh ones with micronutrients
"""
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionScoped
from app.models.food import FoodLog

def delete_todays_logs():
    db = SessionScoped()
    try:
        today = datetime.utcnow().date()
        
        # Get today's logs
        from sqlalchemy import func
        logs = db.query(FoodLog).filter(
            func.date(FoodLog.consumed_at) == today
        ).all()
        
        print(f"Found {len(logs)} food logs for {today}")
        
        if logs:
            for log in logs:
                print(f"  Deleting log: {log.id}")
                db.delete(log)
            
            db.commit()
            print(f"\n✅ Deleted {len(logs)} food logs")
            print("Now you can log fresh food items with micronutrients!")
        else:
            print("No logs to delete")
        
    finally:
        db.close()

if __name__ == "__main__":
    delete_todays_logs()
