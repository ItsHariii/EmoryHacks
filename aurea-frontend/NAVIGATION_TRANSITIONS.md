# Navigation Transitions and Gestures

This document describes the custom navigation transitions and gesture-based navigation implemented in the Aurea app.

## Overview

The app uses smooth, natural transitions (300ms duration with ease-in-out easing) and platform-appropriate gestures to create a premium, responsive user experience.

## Custom Transitions

### 1. Slide from Right Transition
**Used for:** Stack navigation, detail views, nested screens

**Behavior:**
- Slides new screen from right to left
- Previous screen slides out to the left
- 300ms duration with ease-in-out easing

**Screens:**
- Food Logging → Search Food
- Journal → Journal Entry
- All stack navigations

### 2. Fade Transition
**Used for:** Modal screens, overlays, camera screens

**Behavior:**
- New screen fades in
- Previous screen fades out
- 300ms duration

**Screens:**
- Auth Screen
- Barcode Scanner

### 3. Scale Transition
**Used for:** Detail views, expanding cards

**Behavior:**
- New screen scales up from 90% to 100%
- Fades in simultaneously
- Background overlay fades to 50% opacity
- 300ms duration

**Screens:**
- Edit Food Entry (detail modal)

### 4. Modal Slide from Bottom
**Used for:** Modal forms, settings screens

**Behavior:**
- Slides up from bottom of screen
- Background overlay appears
- 300ms duration

**Screens:**
- Notification Settings

## Gesture-Based Navigation

### 1. Swipe Back Gesture (iOS)
**Enabled on:** iOS only
**Trigger:** Swipe from left edge of screen
**Response Distance:** 50px from edge
**Behavior:** Navigates back to previous screen

**Screens:**
- All stack screens in Food and Journal stacks
- Search Food → Food Logging
- Journal Entry → Journal

### 2. Swipe to Dismiss (Modals)
**Enabled on:** iOS and Android
**Trigger:** Swipe down from anywhere on screen
**Response Distance:** 100px
**Behavior:** Dismisses modal screen

**Screens:**
- Edit Food Entry
- Barcode Scanner
- Notification Settings

### 3. Pull Down to Close (Bottom Sheets)
**Enabled on:** iOS and Android
**Trigger:** Pull down from top of bottom sheet
**Response Distance:** 150px
**Behavior:** Closes bottom sheet with animation

**Usage:** Can be applied to future bottom sheet components

## Implementation Details

### Navigation Transitions File
Location: `app/utils/navigationTransitions.ts`

Exports:
- `slideFromRightTransition` - Standard stack transition
- `fadeTransition` - Fade in/out transition
- `scaleTransition` - Scale up with fade
- `modalSlideFromBottomTransition` - Bottom modal
- `enhancedStackScreenOptions` - Stack with gestures
- `enhancedModalScreenOptions` - Modal with gestures

### Gesture Handlers File
Location: `app/utils/gestureHandlers.ts`

Exports:
- `createSwipeGestureHandler` - Generic swipe handler
- `createSwipeBackHandler` - iOS swipe back
- `createModalDismissHandler` - Modal dismiss
- `createBottomSheetDismissHandler` - Bottom sheet dismiss
- Platform detection utilities

## Configuration

### Transition Timing
All transitions use consistent 300ms duration:
```typescript
const transitionConfig = {
  animation: 'timing',
  config: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
};
```

### Gesture Thresholds
- **Swipe Back:** 50px distance, 0.3 velocity
- **Swipe to Dismiss:** 100px distance, 0.5 velocity
- **Pull Down:** 150px distance, 0.4 velocity

## Platform Differences

### iOS
- Swipe back gesture enabled by default
- Uses iOS-style modal presentations
- Smooth spring animations for gestures

### Android
- No swipe back gesture (uses hardware back button)
- Uses Android-style transitions where appropriate
- Ripple effects on touch

## Best Practices

1. **Use appropriate transitions for context:**
   - Stack navigation → Slide from right
   - Modals → Fade or slide from bottom
   - Detail views → Scale transition

2. **Enable gestures where natural:**
   - Stack screens → Swipe back (iOS)
   - Modals → Swipe to dismiss
   - Bottom sheets → Pull down to close

3. **Disable gestures when inappropriate:**
   - Auth screens (prevent accidental dismissal)
   - Main tab navigator (use tab bar instead)
   - Critical forms (require explicit save/cancel)

4. **Maintain consistency:**
   - All transitions use 300ms duration
   - All gestures feel natural and responsive
   - Platform conventions are respected

## Testing

To test transitions and gestures:

1. **Transitions:**
   - Navigate between screens
   - Verify smooth 300ms animations
   - Check that transitions match design

2. **Gestures:**
   - Test swipe back on iOS
   - Test swipe to dismiss on modals
   - Verify gesture response distances
   - Check that gestures feel natural

3. **Platform Testing:**
   - Test on both iOS and Android
   - Verify platform-specific behaviors
   - Check gesture availability per platform

## Future Enhancements

Potential improvements:
- Custom gesture animations for specific screens
- Configurable gesture sensitivity
- Haptic feedback on gesture completion
- Gesture conflict resolution
- Accessibility alternatives for gestures
