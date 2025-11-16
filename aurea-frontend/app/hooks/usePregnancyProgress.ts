import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI } from '../services/api';
import { PregnancyInfo } from '../types';
import { calculatePregnancyWeek, getWeekTip, getTrimesterName } from '../utils/pregnancyCalculations';

interface UsePregnancyProgressResult {
  pregnancyInfo: PregnancyInfo | null;
  weekChanged: boolean;
  dismissWeekChange: () => void;
  refetch: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const LAST_SEEN_WEEK_KEY = 'last_seen_pregnancy_week';

/**
 * Custom hook to calculate and track pregnancy progress
 * Calculates current week from due date and detects week changes
 * Triggers week transition animation when week changes
 */
export const usePregnancyProgress = (): UsePregnancyProgressResult => {
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(null);
  const [weekChanged, setWeekChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate pregnancy information from due date
   */
  const calculatePregnancyInfo = useCallback((dueDate: string): PregnancyInfo => {
    // Calculate current week and trimester
    const weekInfo = calculatePregnancyWeek(dueDate);
    
    // Get week-specific tip
    const weekTip = getWeekTip(weekInfo.week);
    
    // Get trimester name
    const trimesterName = getTrimesterName(weekInfo.trimester);

    return {
      week: weekInfo.week,
      trimester: weekInfo.trimester,
      daysUntilDue: weekInfo.daysUntilDue,
      daysPassed: weekInfo.daysPassed,
      weekTip,
      trimesterName,
    };
  }, []);

  /**
   * Check if week has changed since last visit
   */
  const checkWeekChange = async (currentWeek: number): Promise<boolean> => {
    try {
      const lastSeenWeekStr = await AsyncStorage.getItem(LAST_SEEN_WEEK_KEY);
      
      if (!lastSeenWeekStr) {
        // First time, save current week
        await AsyncStorage.setItem(LAST_SEEN_WEEK_KEY, currentWeek.toString());
        return false;
      }

      const lastSeenWeek = parseInt(lastSeenWeekStr, 10);
      
      if (currentWeek > lastSeenWeek) {
        // Week has changed!
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking week change:', err);
      return false;
    }
  };

  /**
   * Dismiss week change notification and update stored week
   */
  const dismissWeekChange = useCallback(async () => {
    if (pregnancyInfo) {
      try {
        await AsyncStorage.setItem(LAST_SEEN_WEEK_KEY, pregnancyInfo.week.toString());
        setWeekChanged(false);
      } catch (err) {
        console.error('Error dismissing week change:', err);
      }
    }
  }, [pregnancyInfo]);

  /**
   * Fetch user profile and calculate pregnancy progress
   */
  const fetchPregnancyProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile to get due date
      const userProfile = await userAPI.getCurrentUser();

      if (!userProfile.due_date) {
        setError('Due date not set. Please update your profile.');
        setPregnancyInfo(null);
        setLoading(false);
        return;
      }

      // Calculate pregnancy information
      const info = calculatePregnancyInfo(userProfile.due_date);
      setPregnancyInfo(info);

      // Check if week has changed
      const hasWeekChanged = await checkWeekChange(info.week);
      setWeekChanged(hasWeekChanged);
    } catch (err: any) {
      console.error('Error fetching pregnancy progress:', err);
      setError(err.message || 'Failed to load pregnancy information');
      setPregnancyInfo(null);
    } finally {
      setLoading(false);
    }
  }, [calculatePregnancyInfo]);

  // Fetch pregnancy progress on mount
  useEffect(() => {
    fetchPregnancyProgress();
  }, [fetchPregnancyProgress]);

  // Refetch when screen comes into focus (e.g., after updating profile)
  useFocusEffect(
    useCallback(() => {
      fetchPregnancyProgress();
    }, [fetchPregnancyProgress])
  );

  return {
    pregnancyInfo,
    weekChanged,
    dismissWeekChange,
    refetch: fetchPregnancyProgress,
    loading,
    error,
  };
};
