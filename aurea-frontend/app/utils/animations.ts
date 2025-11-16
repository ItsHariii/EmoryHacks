import { Animated, Easing } from 'react-native';
import { theme } from '../theme';

/**
 * Micro-animations utility for icon interactions and UI polish
 * Following the visual design guide for smooth, premium animations
 */

// Animation configuration constants
export const ANIMATION_CONFIG = {
  // Scale animations
  scaleDown: 0.95,
  scaleNormal: 1,
  
  // Timing
  fast: theme.animations.duration.fast,
  normal: theme.animations.duration.normal,
  slow: theme.animations.duration.slow,
  
  // Movement
  slideDistance: 12, // 10-12px for slide-up animations
  
  // Spring configuration
  spring: {
    speed: 50,
    bounciness: 8,
  },
};

/**
 * Scale-down animation on press (95% with spring back)
 * Use for interactive icons and buttons
 */
export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number = ANIMATION_CONFIG.scaleDown,
  duration: number = ANIMATION_CONFIG.fast
) => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    speed: ANIMATION_CONFIG.spring.speed,
    bounciness: ANIMATION_CONFIG.spring.bounciness,
  });
};

/**
 * Scale down on press in
 */
export const scaleDownAnimation = (animatedValue: Animated.Value) => {
  return createScaleAnimation(animatedValue, ANIMATION_CONFIG.scaleDown);
};

/**
 * Scale back to normal on press out
 */
export const scaleUpAnimation = (animatedValue: Animated.Value) => {
  return createScaleAnimation(animatedValue, ANIMATION_CONFIG.scaleNormal);
};

/**
 * Fade-in animation
 * Use for mounting components
 */
export const createFadeInAnimation = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_CONFIG.normal
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Fade-out animation
 */
export const createFadeOutAnimation = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_CONFIG.normal
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide-up animation (10-12px movement)
 * Use for mounting components with fade-in
 */
export const createSlideUpAnimation = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_CONFIG.normal
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Combined fade-in and slide-up animation
 * Use for mounting dashboard sections and cards
 */
export const createFadeInSlideUpAnimation = (
  opacityValue: Animated.Value,
  translateYValue: Animated.Value,
  duration: number = ANIMATION_CONFIG.normal,
  delay: number = 0
) => {
  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(translateYValue, {
      toValue: 0,
      duration,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Subtle pulse animation for progress indicators
 * Use for loading states and progress bars
 */
export const createPulseAnimation = (
  animatedValue: Animated.Value,
  minScale: number = 0.98,
  maxScale: number = 1.02,
  duration: number = 1000
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Progress bar fill animation
 * Use for animating progress bars on mount
 */
export const createProgressFillAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_CONFIG.slow
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false, // Width animations can't use native driver
  });
};

/**
 * Staggered animation for lists
 * Use for animating multiple items with delay
 */
export const createStaggeredAnimation = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 50
) => {
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Spring animation for bouncy interactions
 * Use for modals and overlays
 */
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config?: {
    speed?: number;
    bounciness?: number;
  }
) => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    speed: config?.speed ?? ANIMATION_CONFIG.spring.speed,
    bounciness: config?.bounciness ?? ANIMATION_CONFIG.spring.bounciness,
  });
};

/**
 * Rotation animation
 * Use for loading spinners
 */
export const createRotationAnimation = (
  animatedValue: Animated.Value,
  duration: number = 1000
) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Hook-style animation helpers
 * These return the animated value and start function
 */

export const useScaleAnimation = () => {
  const scaleValue = new Animated.Value(1);
  
  const scaleDown = () => scaleDownAnimation(scaleValue).start();
  const scaleUp = () => scaleUpAnimation(scaleValue).start();
  
  return { scaleValue, scaleDown, scaleUp };
};

export const useFadeInSlideUp = (delay: number = 0) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(ANIMATION_CONFIG.slideDistance);
  
  const animate = () => {
    createFadeInSlideUpAnimation(
      opacity,
      translateY,
      ANIMATION_CONFIG.normal,
      delay
    ).start();
  };
  
  return { opacity, translateY, animate };
};

export const usePulseAnimation = () => {
  const pulseValue = new Animated.Value(1);
  
  const startPulse = () => createPulseAnimation(pulseValue).start();
  const stopPulse = () => pulseValue.stopAnimation();
  
  return { pulseValue, startPulse, stopPulse };
};
