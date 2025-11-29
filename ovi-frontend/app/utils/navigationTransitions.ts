import { Easing } from 'react-native';
import { StackNavigationOptions, TransitionPresets } from '@react-navigation/stack';

/**
 * Custom navigation transitions for Aurea app
 * Following the visual design guide for smooth 300ms transitions
 */

// Base transition timing configuration (300ms ease-in-out)
export const transitionConfig = {
  animation: 'timing' as const,
  config: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
};

/**
 * Slide from right transition for stack navigation
 * Used for: Detail views, nested screens
 */
export const slideFromRightTransition: StackNavigationOptions = {
  ...TransitionPresets.SlideFromRightIOS,
  transitionSpec: {
    open: transitionConfig,
    close: transitionConfig,
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  gestureResponseDistance: 50,
};

/**
 * Fade transition for modal screens
 * Used for: Overlays, confirmations, alerts
 */
export const fadeTransition: StackNavigationOptions = {
  ...TransitionPresets.FadeFromBottomAndroid,
  transitionSpec: {
    open: transitionConfig,
    close: transitionConfig,
  },
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
};

/**
 * Scale transition for detail views
 * Used for: Expanding cards, detail modals
 */
export const scaleTransition: StackNavigationOptions = {
  transitionSpec: {
    open: transitionConfig,
    close: transitionConfig,
  },
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 100,
};

/**
 * Modal slide from bottom transition
 * Used for: Bottom sheets, modal forms
 */
export const modalSlideFromBottomTransition: StackNavigationOptions = {
  ...TransitionPresets.ModalSlideFromBottomIOS,
  transitionSpec: {
    open: transitionConfig,
    close: transitionConfig,
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 100,
};

/**
 * Modal presentation transition
 * Used for: Full-screen modals with backdrop
 */
export const modalPresentationTransition: StackNavigationOptions = {
  presentation: 'modal',
  ...TransitionPresets.ModalPresentationIOS,
  transitionSpec: {
    open: transitionConfig,
    close: transitionConfig,
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 100,
};

/**
 * Reveal from bottom transition
 * Used for: Action sheets, pickers
 */
export const revealFromBottomTransition: StackNavigationOptions = {
  transitionSpec: {
    open: transitionConfig,
    close: transitionConfig,
  },
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 100,
};

/**
 * Default stack screen options with slide from right
 */
export const defaultStackScreenOptions: StackNavigationOptions = {
  ...slideFromRightTransition,
  headerShown: false,
};

/**
 * Modal stack screen options with fade transition
 */
export const modalStackScreenOptions: StackNavigationOptions = {
  ...fadeTransition,
  headerShown: true,
  presentation: 'modal',
};

/**
 * Detail view screen options with scale transition
 */
export const detailViewScreenOptions: StackNavigationOptions = {
  ...scaleTransition,
  headerShown: true,
  presentation: 'transparentModal',
};

/**
 * Bottom sheet screen options
 */
export const bottomSheetScreenOptions: StackNavigationOptions = {
  ...revealFromBottomTransition,
  headerShown: false,
  presentation: 'transparentModal',
};

/**
 * Gesture configuration for swipe-back on iOS
 * Enables natural swipe-back gesture with proper response distance
 */
export const swipeBackGestureConfig: StackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  gestureResponseDistance: 50, // Distance from edge to trigger gesture
  fullScreenGestureEnabled: false, // Only from edge
};

/**
 * Gesture configuration for swipe-to-dismiss modals
 * Enables vertical swipe down to dismiss modal screens
 */
export const swipeToDismissGestureConfig: StackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 100, // Distance from top to trigger gesture
  fullScreenGestureEnabled: true, // Allow from anywhere
};

/**
 * Gesture configuration for pull-down to close bottom sheets
 * Enables natural pull-down gesture for bottom sheet dismissal
 */
export const pullDownToCloseGestureConfig: StackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 150, // Larger distance for bottom sheets
  fullScreenGestureEnabled: true,
};

/**
 * Enhanced stack screen options with iOS-style swipe back
 */
export const enhancedStackScreenOptions: StackNavigationOptions = {
  ...slideFromRightTransition,
  ...swipeBackGestureConfig,
  headerShown: false,
};

/**
 * Enhanced modal screen options with swipe to dismiss
 */
export const enhancedModalScreenOptions: StackNavigationOptions = {
  ...modalSlideFromBottomTransition,
  ...swipeToDismissGestureConfig,
  headerShown: true,
};

/**
 * Enhanced bottom sheet options with pull down to close
 */
export const enhancedBottomSheetOptions: StackNavigationOptions = {
  ...revealFromBottomTransition,
  ...pullDownToCloseGestureConfig,
  headerShown: false,
  presentation: 'transparentModal',
};
