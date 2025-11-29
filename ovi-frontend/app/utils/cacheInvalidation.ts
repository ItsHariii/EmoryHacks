import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache keys used throughout the app
 */
export const CACHE_KEYS = {
  NUTRITION_SUMMARY: 'nutrition_summary_cache',
  NUTRITION_TARGETS: 'nutrition_targets_cache',
  FOOD_ENTRIES: 'food_entries_cache',
  PREGNANCY_INFO: 'pregnancy_info_cache',
};

/**
 * Invalidate specific cache keys
 * @param keys - Array of cache keys to invalidate
 */
export const invalidateCache = async (keys: string[]): Promise<void> => {
  try {
    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    console.log('Cache invalidated:', keys);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};

/**
 * Invalidate all nutrition-related caches
 * Call this after logging, updating, or deleting food entries
 */
export const invalidateNutritionCache = async (): Promise<void> => {
  await invalidateCache([
    CACHE_KEYS.NUTRITION_SUMMARY,
    CACHE_KEYS.FOOD_ENTRIES,
  ]);
};

/**
 * Invalidate all caches
 * Use sparingly - typically only on logout or major data changes
 */
export const invalidateAllCaches = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.endsWith('_cache'));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('All caches invalidated');
  } catch (error) {
    console.error('Error invalidating all caches:', error);
  }
};
