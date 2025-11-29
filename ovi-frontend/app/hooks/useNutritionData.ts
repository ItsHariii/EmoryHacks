import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { nutritionAPI, userAPI } from '../services/api';
import { NutritionSummary, NutritionTargets } from '../types';

interface UseNutritionDataResult {
  summary: NutritionSummary | null;
  targets: NutritionTargets | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CACHE_KEY_SUMMARY = 'nutrition_summary_cache';
const CACHE_KEY_TARGETS = 'nutrition_targets_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook to fetch and manage nutrition data with caching
 * Fetches nutrition summary and targets from the backend API
 * Implements 5-minute TTL caching using AsyncStorage
 */
export const useNutritionData = (date?: string): UseNutritionDataResult => {
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get cached data from AsyncStorage
   */
  const getCachedData = async <T,>(key: string): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cachedData: CachedData<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid (within TTL)
      if (now - cachedData.timestamp < CACHE_TTL) {
        return cachedData.data;
      }

      // Cache expired, remove it
      await AsyncStorage.removeItem(key);
      return null;
    } catch (err) {
      console.error('Error reading cache:', err);
      return null;
    }
  };

  /**
   * Save data to AsyncStorage cache
   */
  const setCachedData = async <T,>(key: string, data: T): Promise<void> => {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cachedData));
    } catch (err) {
      console.error('Error writing cache:', err);
    }
  };

  /**
   * Fetch nutrition data from API
   */
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get cached data first if not forcing refresh
      if (!forceRefresh) {
        const cachedSummary = await getCachedData<NutritionSummary>(CACHE_KEY_SUMMARY);
        const cachedTargets = await getCachedData<NutritionTargets>(CACHE_KEY_TARGETS);

        if (cachedSummary && cachedTargets) {
          setSummary(cachedSummary);
          setTargets(cachedTargets);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data from API
      const [summaryData, targetsData] = await Promise.all([
        nutritionAPI.getDailySummary(date),
        userAPI.getNutritionTargets(),
      ]);

      // Update state
      setSummary(summaryData);
      setTargets(targetsData);

      // Cache the data
      await setCachedData(CACHE_KEY_SUMMARY, summaryData);
      await setCachedData(CACHE_KEY_TARGETS, targetsData);
    } catch (err: any) {
      console.error('Error fetching nutrition data:', err);
      setError(err.message || 'Failed to load nutrition data');
      
      // Try to use cached data as fallback even if expired
      const cachedSummary = await getCachedData<NutritionSummary>(CACHE_KEY_SUMMARY);
      const cachedTargets = await getCachedData<NutritionTargets>(CACHE_KEY_TARGETS);
      
      if (cachedSummary) setSummary(cachedSummary);
      if (cachedTargets) setTargets(cachedTargets);
    } finally {
      setLoading(false);
    }
  }, [date]);

  /**
   * Force refresh data from API
   */
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Fetch data on mount and when date changes
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Check for cache invalidation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkCacheValidity = async () => {
        const cachedSummary = await getCachedData<NutritionSummary>(CACHE_KEY_SUMMARY);
        // If cache was cleared (invalidated), refetch data
        if (!cachedSummary && summary) {
          await fetchData(true);
        }
      };
      checkCacheValidity();
    }, [summary, fetchData])
  );

  return {
    summary,
    targets,
    loading,
    error,
    refresh,
  };
};
