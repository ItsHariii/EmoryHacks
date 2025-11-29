import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPreferences } from '../types';
import {
  requestPermissions,
  scheduleHydrationReminder,
  scheduleSupplementReminder,
  scheduleMealReminder,
  cancelAllNotifications,
  getScheduledNotifications,
  sendTestNotification,
} from '../services/notificationService';

const PREFERENCES_KEY = 'notification_preferences';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  hydration: {
    enabled: false,
    intervalHours: 2,
  },
  supplements: {
    enabled: false,
    time: '08:00',
    name: 'Prenatal Vitamin',
  },
  meals: {
    enabled: false,
    breakfast: '08:00',
    lunch: '12:00',
    dinner: '18:00',
  },
};

export const useNotifications = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    loadPreferences();
    checkPermissions();
  }, []);

  // Update scheduled notification count when preferences change
  useEffect(() => {
    updateScheduledCount();
  }, [preferences]);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  };

  const checkPermissions = async () => {
    try {
      const granted = await requestPermissions();
      setPermissionsGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  };

  const updateScheduledCount = async () => {
    try {
      const scheduled = await getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Error updating scheduled count:', error);
    }
  };

  const scheduleAllNotifications = useCallback(async (prefs: NotificationPreferences) => {
    try {
      // Cancel all existing notifications first
      await cancelAllNotifications();

      if (!prefs.enabled) {
        return;
      }

      // Schedule hydration reminders
      if (prefs.hydration.enabled) {
        await scheduleHydrationReminder(prefs.hydration.intervalHours);
      }

      // Schedule supplement reminder
      if (prefs.supplements.enabled) {
        await scheduleSupplementReminder(
          prefs.supplements.time,
          prefs.supplements.name
        );
      }

      // Schedule meal reminders
      if (prefs.meals.enabled) {
        await scheduleMealReminder(prefs.meals.breakfast, 'breakfast');
        await scheduleMealReminder(prefs.meals.lunch, 'lunch');
        await scheduleMealReminder(prefs.meals.dinner, 'dinner');
      }

      await updateScheduledCount();
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  }, []);

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...updates };
      await savePreferences(newPreferences);
      
      // Reschedule notifications with new preferences
      if (permissionsGranted) {
        await scheduleAllNotifications(newPreferences);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const enableNotifications = async () => {
    try {
      // Request permissions if not already granted
      if (!permissionsGranted) {
        const granted = await checkPermissions();
        if (!granted) {
          throw new Error('Notification permissions not granted');
        }
      }

      const newPreferences = { ...preferences, enabled: true };
      await savePreferences(newPreferences);
      await scheduleAllNotifications(newPreferences);
    } catch (error) {
      console.error('Error enabling notifications:', error);
      throw error;
    }
  };

  const disableNotifications = async () => {
    try {
      await cancelAllNotifications();
      const newPreferences = { ...preferences, enabled: false };
      await savePreferences(newPreferences);
      setScheduledCount(0);
    } catch (error) {
      console.error('Error disabling notifications:', error);
      throw error;
    }
  };

  const testNotification = async (type: 'hydration' | 'supplement' | 'meal') => {
    try {
      if (!permissionsGranted) {
        const granted = await checkPermissions();
        if (!granted) {
          throw new Error('Notification permissions not granted');
        }
      }
      await sendTestNotification(type);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  const resetToDefaults = async () => {
    try {
      await cancelAllNotifications();
      await savePreferences(DEFAULT_PREFERENCES);
      setScheduledCount(0);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  };

  return {
    preferences,
    loading,
    permissionsGranted,
    scheduledCount,
    updatePreferences,
    enableNotifications,
    disableNotifications,
    checkPermissions,
    testNotification,
    resetToDefaults,
    scheduleAllNotifications,
  };
};
