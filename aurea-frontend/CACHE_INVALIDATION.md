# Cache Invalidation System

## Overview

The app uses a cache invalidation system to ensure the dashboard and other screens update immediately when data changes (e.g., when food is logged, updated, or deleted).

## How It Works

### 1. Cache Storage
- Nutrition data is cached in AsyncStorage with a 5-minute TTL (Time To Live)
- Cache keys are defined in `app/utils/cacheInvalidation.ts`

### 2. Automatic Invalidation
When food-related actions occur, the cache is automatically invalidated:

**Food Logging** (`foodAPI.logFood`)
- ✅ Invalidates nutrition cache after logging food
- Dashboard will refresh on next focus

**Food Update** (`foodAPI.updateFoodEntry`)
- ✅ Invalidates nutrition cache after updating entry
- Dashboard will refresh on next focus

**Food Delete** (`foodAPI.deleteFoodEntry`)
- ✅ Invalidates nutrition cache after deleting entry
- Dashboard will refresh on next focus

### 3. Automatic Refresh
The `useNutritionData` hook checks for cache invalidation when:
- Screen comes into focus (`useFocusEffect`)
- If cache is missing but data exists in state, it refetches

## User Experience

### Before Cache Invalidation
1. User logs food → Food saved to database
2. User navigates to Dashboard → Shows old cached data
3. User must manually pull-to-refresh or wait 5 minutes

### After Cache Invalidation
1. User logs food → Food saved to database → Cache invalidated
2. User navigates to Dashboard → Detects missing cache → Automatically refetches
3. Dashboard shows updated nutrition data immediately ✨

## Implementation Details

### Cache Keys
```typescript
export const CACHE_KEYS = {
  NUTRITION_SUMMARY: 'nutrition_summary_cache',
  NUTRITION_TARGETS: 'nutrition_targets_cache',
  FOOD_ENTRIES: 'food_entries_cache',
  PREGNANCY_INFO: 'pregnancy_info_cache',
};
```

### Invalidation Function
```typescript
export const invalidateNutritionCache = async (): Promise<void> => {
  await invalidateCache([
    CACHE_KEYS.NUTRITION_SUMMARY,
    CACHE_KEYS.FOOD_ENTRIES,
  ]);
};
```

### Usage in API
```typescript
logFood: async (foodData) => {
  const response = await api.post('/food/log', foodData);
  await invalidateNutritionCache(); // ← Invalidate cache
  return response.data;
}
```

## Benefits

1. **Immediate Updates** - Dashboard reflects changes instantly
2. **Better UX** - No manual refresh needed
3. **Reduced API Calls** - Still uses cache when data hasn't changed
4. **Consistent State** - All screens show the same data

## Future Enhancements

- Add cache invalidation for journal entries
- Implement optimistic updates (update UI before API response)
- Add cache versioning for schema changes
- Implement selective cache invalidation (only invalidate affected dates)
