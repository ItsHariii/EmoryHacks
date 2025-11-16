import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CELEBRATIONS_KEY = '@aurea_celebrated_milestones';

export type MilestoneType = 
  | 'first_meal_logged'
  | 'first_journal_entry'
  | 'daily_calories_100_percent';

interface Milestone {
  type: MilestoneType;
  celebratedAt: string;
}

interface CelebrationData {
  title: string;
  message: string;
}

const MILESTONE_MESSAGES: Record<MilestoneType, CelebrationData> = {
  first_meal_logged: {
    title: '🎉 First Meal Logged!',
    message: "You've taken the first step in tracking your nutrition. Keep up the great work!",
  },
  first_journal_entry: {
    title: '📝 Journal Started!',
    message: "You've created your first journal entry. This will help you track your wellness journey!",
  },
  daily_calories_100_percent: {
    title: '🌟 Daily Goal Reached!',
    message: "Amazing! You've reached 100% of your daily calorie target. You're doing great!",
  },
};

/**
 * useCelebrations Hook
 * 
 * Manages milestone celebrations and stores them in AsyncStorage
 * to avoid showing the same celebration multiple times
 * 
 * Features:
 * - Track celebrated milestones
 * - Check if milestone should be celebrated
 * - Get celebration data for display
 * - Store celebrations in AsyncStorage
 * 
 * Requirements: 4.4
 */
export const useCelebrations = () => {
  const [celebratedMilestones, setCelebratedMilestones] = useState<Milestone[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load celebrated milestones from AsyncStorage
  useEffect(() => {
    loadCelebratedMilestones();
  }, []);

  const loadCelebratedMilestones = async () => {
    try {
      const stored = await AsyncStorage.getItem(CELEBRATIONS_KEY);
      if (stored) {
        const milestones: Milestone[] = JSON.parse(stored);
        setCelebratedMilestones(milestones);
      }
    } catch (error) {
      console.error('Error loading celebrated milestones:', error);
    }
  };

  const saveCelebratedMilestones = async (milestones: Milestone[]) => {
    try {
      await AsyncStorage.setItem(CELEBRATIONS_KEY, JSON.stringify(milestones));
    } catch (error) {
      console.error('Error saving celebrated milestones:', error);
    }
  };

  /**
   * Check if a milestone has already been celebrated
   */
  const hasCelebrated = useCallback(
    (milestoneType: MilestoneType): boolean => {
      return celebratedMilestones.some((m) => m.type === milestoneType);
    },
    [celebratedMilestones]
  );

  /**
   * Celebrate a milestone if it hasn't been celebrated before
   * Returns true if celebration was triggered, false if already celebrated
   */
  const celebrate = useCallback(
    async (milestoneType: MilestoneType): Promise<boolean> => {
      // Check if already celebrated
      if (hasCelebrated(milestoneType)) {
        return false;
      }

      // Get celebration data
      const celebrationData = MILESTONE_MESSAGES[milestoneType];
      if (!celebrationData) {
        console.warn(`No celebration data for milestone: ${milestoneType}`);
        return false;
      }

      // Mark as celebrated
      const newMilestone: Milestone = {
        type: milestoneType,
        celebratedAt: new Date().toISOString(),
      };

      const updatedMilestones = [...celebratedMilestones, newMilestone];
      setCelebratedMilestones(updatedMilestones);
      await saveCelebratedMilestones(updatedMilestones);

      // Show celebration
      setCurrentCelebration(celebrationData);
      setShowCelebration(true);

      return true;
    },
    [celebratedMilestones, hasCelebrated]
  );

  /**
   * Dismiss the current celebration
   */
  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setCurrentCelebration(null);
  }, []);

  /**
   * Reset all celebrations (for testing/debugging)
   */
  const resetCelebrations = useCallback(async () => {
    setCelebratedMilestones([]);
    await AsyncStorage.removeItem(CELEBRATIONS_KEY);
  }, []);

  return {
    celebrate,
    hasCelebrated,
    dismissCelebration,
    resetCelebrations,
    currentCelebration,
    showCelebration,
    celebratedMilestones,
  };
};
