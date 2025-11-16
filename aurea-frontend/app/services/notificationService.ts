import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if notifications are available
// In development builds, notifications should work. Only Expo Go doesn't support them.
const NOTIFICATIONS_AVAILABLE = true;

// Configure notification handler only if available
if (NOTIFICATIONS_AVAILABLE) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export interface NotificationIdentifiers {
  hydration?: string[];
  supplement?: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

const NOTIFICATION_IDS_KEY = 'notification_identifiers';

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if permissions granted, false otherwise
 */
export const requestPermissions = async (): Promise<boolean> => {
  if (!NOTIFICATIONS_AVAILABLE) {
    console.log('Notifications not available in Expo Go. Use a development build.');
    return false;
  }
  
  try {
    // First check current permissions
    const { status: currentStatus } = await Notifications.getPermissionsAsync();
    
    // If already granted, configure and return true
    if (currentStatus === 'granted') {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B0000',
        });
      }
      return true;
    }

    // If not granted, try to request
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Notification permissions not granted, status:', status);
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B0000',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule hydration reminders at regular intervals
 * @param intervalHours - Hours between reminders (1-4)
 * @returns Promise<string[]> - Array of notification identifiers
 */
export const scheduleHydrationReminder = async (
  intervalHours: number = 2
): Promise<string[]> => {
  try {
    // Cancel existing hydration reminders
    const existingIds = await getNotificationIds();
    if (existingIds.hydration && existingIds.hydration.length > 0) {
      for (const id of existingIds.hydration) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }

    const notificationIds: string[] = [];
    
    // Schedule reminders during waking hours (8 AM to 10 PM)
    const startHour = 8;
    const endHour = 22;
    const totalHours = endHour - startHour;
    const reminderCount = Math.floor(totalHours / intervalHours);

    for (let i = 0; i < reminderCount; i++) {
      const hour = startHour + (i * intervalHours);
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Time to Hydrate',
          body: 'Remember to drink water! Stay hydrated for you and baby.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'hydration', screen: 'Dashboard' },
        },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
        },
      });
      
      notificationIds.push(id);
    }

    // Save notification IDs
    await saveNotificationIds({ ...existingIds, hydration: notificationIds });
    
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling hydration reminder:', error);
    throw error;
  }
};

/**
 * Schedule supplement reminder at a specific time
 * @param time - Time string in HH:mm format (e.g., "08:00")
 * @param supplementName - Name of the supplement
 * @returns Promise<string> - Notification identifier
 */
export const scheduleSupplementReminder = async (
  time: string,
  supplementName: string = 'Prenatal Vitamin'
): Promise<string> => {
  try {
    // Cancel existing supplement reminder
    const existingIds = await getNotificationIds();
    if (existingIds.supplement) {
      await Notifications.cancelScheduledNotificationAsync(existingIds.supplement);
    }

    // Parse time string
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time format. Use HH:mm format.');
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Supplement Reminder',
        body: `Time to take your ${supplementName}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'supplement', screen: 'Dashboard' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Save notification ID
    await saveNotificationIds({ ...existingIds, supplement: id });
    
    return id;
  } catch (error) {
    console.error('Error scheduling supplement reminder:', error);
    throw error;
  }
};

/**
 * Schedule meal reminder at a specific time
 * @param time - Time string in HH:mm format (e.g., "08:00")
 * @param mealType - Type of meal ('breakfast', 'lunch', 'dinner')
 * @returns Promise<string> - Notification identifier
 */
export const scheduleMealReminder = async (
  time: string,
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<string> => {
  try {
    // Cancel existing meal reminder
    const existingIds = await getNotificationIds();
    const existingId = existingIds[mealType];
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    // Parse time string
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time format. Use HH:mm format.');
    }

    const mealNames = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍽️ Log Your Meal',
        body: `Don't forget to log your ${mealNames[mealType]}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'meal', mealType, screen: 'FoodLogging' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Save notification ID
    await saveNotificationIds({ ...existingIds, [mealType]: id });
    
    return id;
  } catch (error) {
    console.error('Error scheduling meal reminder:', error);
    throw error;
  }
};

/**
 * Cancel a specific notification
 * @param notificationId - The notification identifier to cancel
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
    throw error;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    throw error;
  }
};

/**
 * Get all scheduled notifications
 * @returns Promise<Notifications.NotificationRequest[]>
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Set up notification response listener for handling notification taps
 * @param navigationRef - React Navigation ref for navigation
 */
export const setupNotificationListener = (
  navigationRef: any
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    
    if (data && data.screen && navigationRef.current) {
      // Navigate to the appropriate screen based on notification data
      navigationRef.current.navigate(data.screen, data.mealType ? { mealType: data.mealType } : undefined);
    }
  });
};

/**
 * Send a test notification immediately
 * @param type - Type of notification to test
 */
export const sendTestNotification = async (
  type: 'hydration' | 'supplement' | 'meal'
): Promise<void> => {
  try {
    const notifications = {
      hydration: {
        title: '💧 Time to Hydrate',
        body: 'Remember to drink water! Stay hydrated for you and baby.',
      },
      supplement: {
        title: '💊 Supplement Reminder',
        body: 'Time to take your Prenatal Vitamin',
      },
      meal: {
        title: '🍽️ Log Your Meal',
        body: "Don't forget to log your meal",
      },
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notifications[type].title,
        body: notifications[type].body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type, screen: 'Dashboard' },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

// Helper functions for managing notification IDs
const getNotificationIds = async (): Promise<NotificationIdentifiers> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting notification IDs:', error);
    return {};
  }
};

const saveNotificationIds = async (ids: NotificationIdentifiers): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving notification IDs:', error);
  }
};
