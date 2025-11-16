# Animations Implementation Summary

This document summarizes all the smooth animations and transitions implemented throughout the Aurea frontend application.

## Overview

All animations follow a consistent timing of 300ms with ease-in-out easing, creating a fluid and calming user experience. The animations are designed to feel alive but not distracting, enhancing the premium wellness-brand aesthetic.

## Implemented Animations

### 1. Screen Transitions (300ms ease-in-out)

**Location**: `App.tsx`

- **Stack Navigation**: Slide-from-right transitions for all stack navigators
- **Modal Screens**: Slide-from-bottom for modal-style screens (e.g., Notification Settings)
- **Auth Screen**: Fade transition for authentication screen
- **Duration**: 300ms with ease-in-out easing

**Implementation**:
```typescript
const screenTransitionConfig = {
  animation: 'timing' as const,
  config: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
};
```

### 2. Dashboard Section Animations (Fade-in + Slide-up)

**Location**: `DashboardScreen.tsx`

- **Pregnancy Week Section**: Fades in and slides up 12px with 0ms delay
- **Macronutrients Section**: Fades in and slides up 12px with 100ms delay
- **Micronutrients Section**: Fades in and slides up 12px with 200ms delay
- **Journal Section**: Fades in and slides up 12px with 300ms delay
- **Quick Actions Section**: Fades in and slides up 12px with 400ms delay

**Effect**: Creates a staggered entrance animation that draws the eye down the page naturally.

**Implementation**:
```typescript
useEffect(() => {
  if (!isInitialLoading && (pregnancyInfo || nutritionSummary)) {
    createFadeInSlideUpAnimation(pregnancyOpacity, pregnancyTranslateY, ANIMATION_CONFIG.normal, 0).start();
    createFadeInSlideUpAnimation(macroOpacity, macroTranslateY, ANIMATION_CONFIG.normal, 100).start();
    createFadeInSlideUpAnimation(microOpacity, microTranslateY, ANIMATION_CONFIG.normal, 200).start();
    createFadeInSlideUpAnimation(journalOpacity, journalTranslateY, ANIMATION_CONFIG.normal, 300).start();
    createFadeInSlideUpAnimation(actionsOpacity, actionsTranslateY, ANIMATION_CONFIG.normal, 400).start();
  }
}, [isInitialLoading, pregnancyInfo, nutritionSummary]);
```

### 3. Progress Bar Fill Animations

**Location**: `ProgressBar.tsx`, `MacronutrientCard.tsx`

- **Animated Fill**: Progress bars animate from 0% to target percentage on mount
- **Duration**: 400ms (slow) with cubic ease-out
- **Effect**: Creates a satisfying visual feedback as progress bars fill

**Implementation**:
```typescript
useEffect(() => {
  createProgressFillAnimation(animatedWidth, percentage).start();
}, [percentage]);
```

### 4. Icon Pulse Animation (Goal Achievement)

**Location**: `MacronutrientCard.tsx`

- **Trigger**: When macronutrient reaches 100% of target
- **Animation**: Subtle pulse between 98% and 102% scale
- **Duration**: 1500ms loop
- **Effect**: Draws attention to completed goals without being distracting

**Implementation**:
```typescript
useEffect(() => {
  if (percentage >= 100) {
    const pulseAnimation = createPulseAnimation(iconPulseAnim, 0.98, 1.02, 1500);
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }
}, [percentage]);
```

### 5. Button Press Animation (Scale Down)

**Location**: `Button.tsx`

- **Scale**: 95% on press, springs back to 100% on release
- **Spring Config**: Speed 50, bounciness 8
- **Effect**: Provides tactile feedback for all button interactions

**Implementation**:
```typescript
const handlePressIn = () => {
  if (loading || disabled) return;
  scaleDownAnimation(scaleValue).start();
};

const handlePressOut = () => {
  if (loading || disabled) return;
  scaleUpAnimation(scaleValue).start();
};
```

### 6. Card Press Animation (Scale Down)

**Location**: `Card.tsx`

- **Scale**: 95% on press, springs back to 100% on release
- **Applied**: Only when card has onPress handler
- **Effect**: Makes tappable cards feel responsive and interactive

### 7. Icon Badge Press Animation

**Location**: `IconBadge.tsx`

- **Scale**: 95% on press, springs back to 100% on release
- **Spring Config**: Speed 50, bounciness 8
- **Effect**: All icon interactions feel alive and responsive

### 8. Toast Slide-in Animation

**Location**: `Toast.tsx`

- **Entrance**: Slides down from top with fade-in
- **Exit**: Slides up with fade-out
- **Swipe Gesture**: Supports swipe-to-dismiss with smooth animation
- **Duration**: 300ms for entrance/exit

### 9. Week Transition Modal Animation

**Location**: `WeekTransitionAnimation.tsx`

- **Background Fade**: Semi-transparent background fades in (300ms)
- **Week Number**: Scales in with spring animation (speed 12, bounciness 10)
- **Content Fade**: Milestone text fades in after week number (400ms delay)
- **Confetti Particles**: 20 particles animate outward with rotation and fade
- **Effect**: Celebratory animation for new pregnancy week

### 10. Modal Slide-in Animations

**Location**: Various modal components

- **Standard Modals**: Slide in from bottom with fade
- **Full-screen Modals**: Fade in with scale animation
- **Duration**: 300ms ease-in-out

## Animation Utilities

**Location**: `app/utils/animations.ts`

The animations utility provides reusable animation functions:

- `createScaleAnimation()`: Scale animations with spring
- `createFadeInAnimation()`: Fade in with timing
- `createFadeOutAnimation()`: Fade out with timing
- `createSlideUpAnimation()`: Slide up with timing
- `createFadeInSlideUpAnimation()`: Combined fade and slide
- `createPulseAnimation()`: Looping pulse animation
- `createProgressFillAnimation()`: Progress bar fill
- `createStaggeredAnimation()`: Stagger multiple animations
- `createSpringAnimation()`: Spring-based animations
- `createRotationAnimation()`: Rotation animations

## Animation Configuration

**Location**: `app/utils/animations.ts`

```typescript
export const ANIMATION_CONFIG = {
  scaleDown: 0.95,
  scaleNormal: 1,
  fast: 200,
  normal: 300,
  slow: 400,
  slideDistance: 12,
  spring: {
    speed: 50,
    bounciness: 8,
  },
};
```

## Performance Considerations

1. **Native Driver**: All transform and opacity animations use `useNativeDriver: true` for 60fps performance
2. **Width Animations**: Progress bar width animations use `useNativeDriver: false` (required for width)
3. **Memoization**: Animation values are created with `useRef` to prevent recreation on re-renders
4. **Cleanup**: All looping animations are properly cleaned up in useEffect return functions

## Accessibility

All animations maintain accessibility:
- Animations don't interfere with screen readers
- Touch targets remain 44x44 minimum during animations
- Animations can be disabled via system preferences (future enhancement)

## Testing

To verify animations:
1. Navigate through the app and observe smooth screen transitions
2. Open Dashboard and watch sections fade in and slide up
3. Log food and watch progress bars animate
4. Reach 100% of a macronutrient goal to see icon pulse
5. Press buttons and cards to feel the scale animation
6. Swipe toast notifications to dismiss

## Future Enhancements

Potential animation improvements:
- Respect system "Reduce Motion" preference
- Add haptic feedback to more interactions
- Implement skeleton loading animations
- Add celebration animations for milestones
- Enhance tab bar transitions with custom animations
