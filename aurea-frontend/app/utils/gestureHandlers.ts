import { Platform } from 'react-native';
import { GestureResponderEvent, PanResponder, PanResponderInstance } from 'react-native';

/**
 * Gesture handlers for natural and responsive navigation interactions
 * Following iOS and Android platform conventions
 */

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe
  velocityThreshold?: number; // Minimum velocity to trigger swipe
}

/**
 * Create a pan responder for swipe gestures
 * Detects swipe direction and triggers appropriate callback
 */
export const createSwipeGestureHandler = (
  config: SwipeGestureConfig
): PanResponderInstance => {
  const threshold = config.threshold || 50;
  const velocityThreshold = config.velocityThreshold || 0.3;

  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      const { dx, dy } = gestureState;
      return Math.abs(dx) > 5 || Math.abs(dy) > 5;
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy, vx, vy } = gestureState;

      // Check horizontal swipes
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold && vx > velocityThreshold) {
          config.onSwipeRight?.();
        } else if (dx < -threshold && vx < -velocityThreshold) {
          config.onSwipeLeft?.();
        }
      }
      // Check vertical swipes
      else {
        if (dy > threshold && vy > velocityThreshold) {
          config.onSwipeDown?.();
        } else if (dy < -threshold && vy < -velocityThreshold) {
          config.onSwipeUp?.();
        }
      }
    },
  });
};

/**
 * iOS-style swipe back gesture configuration
 * Enables swipe from left edge to go back
 */
export const createSwipeBackHandler = (onSwipeBack: () => void) => {
  if (Platform.OS !== 'ios') {
    return null; // Only enable on iOS
  }

  return createSwipeGestureHandler({
    onSwipeRight: onSwipeBack,
    threshold: 50,
    velocityThreshold: 0.3,
  });
};

/**
 * Modal dismiss gesture configuration
 * Enables swipe down to dismiss modal
 */
export const createModalDismissHandler = (onDismiss: () => void) => {
  return createSwipeGestureHandler({
    onSwipeDown: onDismiss,
    threshold: 100,
    velocityThreshold: 0.5,
  });
};

/**
 * Bottom sheet pull down gesture configuration
 * Enables pull down to close bottom sheet
 */
export const createBottomSheetDismissHandler = (onDismiss: () => void) => {
  return createSwipeGestureHandler({
    onSwipeDown: onDismiss,
    threshold: 150,
    velocityThreshold: 0.4,
  });
};

/**
 * Check if gesture should be enabled based on platform
 */
export const shouldEnableGesture = (
  gestureType: 'swipeBack' | 'swipeToDismiss' | 'pullDown'
): boolean => {
  switch (gestureType) {
    case 'swipeBack':
      // Swipe back is iOS-specific
      return Platform.OS === 'ios';
    case 'swipeToDismiss':
    case 'pullDown':
      // Modal gestures work on both platforms
      return true;
    default:
      return false;
  }
};

/**
 * Get platform-specific gesture response distance
 */
export const getGestureResponseDistance = (
  gestureType: 'swipeBack' | 'swipeToDismiss' | 'pullDown'
): number => {
  switch (gestureType) {
    case 'swipeBack':
      return Platform.OS === 'ios' ? 50 : 0;
    case 'swipeToDismiss':
      return 100;
    case 'pullDown':
      return 150;
    default:
      return 50;
  }
};

/**
 * Gesture velocity thresholds for natural feel
 */
export const GESTURE_VELOCITY_THRESHOLD = {
  slow: 0.2,
  normal: 0.3,
  fast: 0.5,
};

/**
 * Gesture distance thresholds
 */
export const GESTURE_DISTANCE_THRESHOLD = {
  small: 30,
  medium: 50,
  large: 100,
  xlarge: 150,
};
