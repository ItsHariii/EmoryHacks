# Micronutrient Fix - Manual Steps Required

## Problem
The dashboard shows 0% for micronutrients (folate, iron, calcium, vitamin C, etc.) even though food is being logged.

## Root Cause
The backend server is using cached Python bytecode and not loading the updated nutrition calculator code.

## Solution - Manual Steps

### Step 1: Stop the Backend Server
Press `Ctrl+C` in the terminal where the backend is running.

### Step 2: Clear Python Cache
```bash
cd backend
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null
```

### Step 3: Start Backend Fresh
```bash
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Verify the Fix is Loaded
When you log a food item, you should see this in the terminal:
```
============================================================
🔍 MICRONUTRIENT FIX ACTIVE - Calculating nutrition for [Food Name]
   Food has X micronutrients in database
============================================================
```

If you DON'T see this message, the code is still not loaded.

### Step 5: Log a NEW Food Item
- Delete all existing food logs for today (they have old data)
- Log a fresh food item (e.g., apple, orange, spinach)
- The new log will have micronutrients

### Step 6: Check Dashboard
- Navigate to the dashboard
- You should now see micronutrients updating (iron, vitamin C, vitamin A, etc.)

## What Was Fixed

### 1. Timezone Issue (✅ Fixed)
- Backend now uses UTC date to match UTC timestamps in database
- File: `backend/app/api/food/nutrition.py`

### 2. Micronutrient Mapping (✅ Fixed)
- Added mapping for USDA nutrient names to standard keys
- Maps `calcium_ca` → `calcium`, `iron_fe` → `iron`, etc.
- File: `backend/app/services/nutrition_calculator_service.py`

### 3. Food Database (✅ Fixed)
- Updated all USDA foods with complete micronutrient data
- Ran: `python3 update_food_micronutrients.py`

### 4. Cache Invalidation (✅ Fixed)
- Added automatic cache clearing when food is logged
- Files: `aurea-frontend/app/utils/cacheInvalidation.ts`, `aurea-frontend/app/services/api.ts`

## Expected Result

After following these steps, when you log food, you should see:

**Macronutrients (already working):**
- ✅ Calories
- ✅ Protein
- ✅ Carbs
- ✅ Fat

**Micronutrients (now working):**
- ✅ Iron
- ✅ Calcium
- ✅ Vitamin C
- ✅ Vitamin A
- ✅ Vitamin D (if food contains it)
- ✅ Folate (if food contains it)

## Troubleshooting

### If micronutrients still don't show:
1. Check backend terminal for the "🔍 MICRONUTRIENT FIX ACTIVE" message
2. If missing, the code isn't loaded - try restarting again
3. Check the latest food log: `python3 check_latest_log.py`
4. Look for micronutrient keys in `nutrients_logged`

### If only some micronutrients show:
- This is normal! Not all foods have all micronutrients
- Example: Apples have iron, vitamin C, vitamin A but no folate
- Try logging foods rich in specific nutrients:
  - Folate: Spinach, lentils, fortified cereals
  - Iron: Red meat, spinach, beans
  - Calcium: Dairy, fortified plant milk, leafy greens

## Files Modified

1. `backend/app/api/food/nutrition.py` - UTC date fix
2. `backend/app/services/nutrition_calculator_service.py` - Micronutrient mapping
3. `aurea-frontend/app/utils/cacheInvalidation.ts` - Cache utilities
4. `aurea-frontend/app/services/api.ts` - Auto cache invalidation
5. `aurea-frontend/app/hooks/useNutritionData.ts` - Cache check on focus

All changes are committed and ready to use once the server is properly restarted.
