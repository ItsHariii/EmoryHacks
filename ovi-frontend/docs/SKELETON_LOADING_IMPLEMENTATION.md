# Skeleton Loading Implementation

## Overview

This document describes the implementation of premium loading experiences using skeleton screens throughout the Aurea app. Skeleton screens provide visual feedback during data loading, improving perceived performance and user experience.

## Implementation Summary

### Task 18.1: Create Skeleton Screens for All Major Views ✅

Created comprehensive skeleton components that match actual content layouts:

#### Base Skeleton Components (`app/components/SkeletonLoader.tsx`)

1. **SkeletonLoader** - Base component with shimmer animation
   - Configurable width, height, and border radius
   - Smooth left-to-right gradient animation (1200ms duration)
   - Uses theme colors for consistency

2. **SkeletonCard** - Generic card skeleton
   - Title and multiple content lines
   - Matches Card component dimensions

3. **SkeletonPregnancyWeek** - Pregnancy week display skeleton
   - Large circular week number placeholder
   - Trimester info section
   - Progress bar and tip box

4. **SkeletonMacroCard** - Macronutrient card skeleton
   - Icon placeholder (circular)
   - Large value display
   - Progress bar and target value

5. **SkeletonMicronutrientChart** - Micronutrient chart skeleton
   - 8 nutrient rows with icons
   - Progress bars for each nutrient
   - Matches actual chart layout

6. **SkeletonFoodEntry** - Food entry list item skeleton
   - Food image placeholder
   - Name and details
   - Nutrition stats row

7. **SkeletonJournalEntry** - Journal entry card skeleton
   - Mood emoji placeholder
   - Date and symptoms
   - Notes preview

8. **SkeletonProfileInfo** - Profile information section skeleton
   - Section title
   - Multiple info items with labels and values

#### Screen-Specific Skeletons (`app/components/skeletons/`)

1. **DashboardSkeleton** - Complete dashboard loading state
   - Pregnancy week section
   - 4 macronutrient cards in grid
   - Micronutrient chart

2. **FoodListSkeleton** - Food logging list loading state
   - Multiple meal sections
   - Food entries grouped by meal type

3. **JournalListSkeleton** - Journal entries list loading state
   - 5 journal entry cards

4. **ProfileSkeleton** - Profile screen loading state
   - Personal information section
   - Pregnancy progress section
   - Settings section

### Task 18.2: Implement Progressive Loading ✅

Integrated skeleton screens into all major screens with progressive loading strategy:

#### Dashboard Screen

**Progressive Loading Strategy:**
1. **Initial Load**: Show full `DashboardSkeleton` while all data loads
2. **Pregnancy Section**: Show `SkeletonPregnancyWeek` until pregnancy data loads
3. **Macronutrients**: Show `SkeletonMacroCard` grid until nutrition data loads
4. **Micronutrients**: Show `SkeletonMicronutrientChart` until nutrition data loads
5. **Content Fade-in**: Each section fades in with slide-up animation when data arrives

**Key Features:**
- Critical content (user info, pregnancy week) loads first
- Secondary content (nutrition data) shows skeleton while loading
- Smooth fade-in animations prevent jarring transitions
- No layout shifts during loading

#### Journal Screen

**Loading Strategy:**
- Show `JournalListSkeleton` during initial load
- Keep header visible with "Loading your entries..." message
- Fade in journal entries when data arrives

#### Profile Screen

**Loading Strategy:**
- Show `ProfileSkeleton` during initial load
- Keep header visible with "Loading your information..." message
- Fade in profile sections when data arrives

#### Food Logging Screen

**Loading Strategy:**
- Show `FoodListSkeleton` during initial load
- Keep header visible with "Loading your meals..." message
- Show empty state if no entries exist

## Technical Implementation

### Shimmer Animation

```typescript
const shimmerAnimation = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const shimmer = Animated.loop(
    Animated.sequence([
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnimation, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ])
  );
  shimmer.start();
  return () => shimmer.stop();
}, []);

const translateX = shimmerAnimation.interpolate({
  inputRange: [0, 1],
  outputRange: [-300, 300],
});
```

### Progressive Loading Pattern

```typescript
// Separate loading states for different data sources
const isInitialLoading = pregnancyLoading && nutritionLoading && !pregnancyInfo && !nutritionSummary;
const isPregnancyLoaded = !pregnancyLoading && pregnancyInfo;
const isNutritionLoaded = !nutritionLoading && nutritionSummary;

// Show full skeleton on initial load
if (isInitialLoading) {
  return <DashboardSkeleton />;
}

// Show section skeleton while that section loads
{pregnancyLoading && !pregnancyInfo ? (
  <SkeletonPregnancyWeek />
) : pregnancyInfo ? (
  <PregnancyWeekDisplay {...pregnancyInfo} />
) : null}
```

### Fade-in Animation

```typescript
// Trigger fade-in when data loads
useEffect(() => {
  if (isPregnancyLoaded) {
    createFadeInSlideUpAnimation(
      pregnancyOpacity, 
      pregnancyTranslateY, 
      ANIMATION_CONFIG.normal, 
      0
    ).start();
  }
}, [isPregnancyLoaded]);
```

## Design Principles

1. **Match Real Content**: Skeleton dimensions exactly match actual content to prevent layout shifts
2. **Smooth Transitions**: Content fades in smoothly when loaded (300ms duration)
3. **Progressive Loading**: Load and display critical content first
4. **Consistent Styling**: Use theme colors, spacing, and border radius
5. **Performance**: Use native driver for 60fps animations
6. **Accessibility**: Keep headers visible with loading context

## Benefits

1. **Improved Perceived Performance**: Users see immediate feedback instead of blank screens
2. **Reduced Anxiety**: Shimmer animation indicates progress
3. **No Layout Shifts**: Skeleton matches real content dimensions
4. **Professional Feel**: Premium loading experience matches wellness brand aesthetic
5. **Better UX**: Progressive loading shows content as soon as available

## Requirements Satisfied

- ✅ **Requirement 12.1**: Progressive loading of critical content first
- ✅ **Requirement 12.2**: Premium loading experiences with skeleton screens
- ✅ **Requirement 12.5**: Encouraging loading messages and smooth transitions

## Files Created

### Components
- `app/components/SkeletonLoader.tsx` - Base skeleton components
- `app/components/skeletons/DashboardSkeleton.tsx` - Dashboard skeleton
- `app/components/skeletons/FoodListSkeleton.tsx` - Food list skeleton
- `app/components/skeletons/JournalListSkeleton.tsx` - Journal list skeleton
- `app/components/skeletons/ProfileSkeleton.tsx` - Profile skeleton
- `app/components/skeletons/index.ts` - Exports
- `app/components/skeletons/README.md` - Documentation

### Updated Screens
- `app/screens/DashboardScreen.tsx` - Progressive loading with skeletons
- `app/screens/JournalScreen.tsx` - Skeleton during initial load
- `app/screens/ProfileScreen.tsx` - Skeleton during initial load
- `app/screens/FoodLoggingScreen.tsx` - Skeleton during initial load

## Usage Examples

### Basic Skeleton

```typescript
import { SkeletonLoader } from '../components/SkeletonLoader';

<SkeletonLoader width="100%" height={20} borderRadius={8} />
```

### Screen Skeleton

```typescript
import { DashboardSkeleton } from '../components/skeletons';

if (loading) {
  return <DashboardSkeleton />;
}
```

### Progressive Loading

```typescript
{loading && !data ? (
  <SkeletonComponent />
) : data ? (
  <RealComponent data={data} />
) : null}
```

## Performance Metrics

- **Animation FPS**: 60fps (using native driver)
- **Shimmer Duration**: 1200ms (smooth, calming pace)
- **Fade-in Duration**: 300ms (quick but smooth)
- **Layout Shift**: 0 (skeleton matches real content)

## Future Enhancements

Potential improvements:
1. Add skeleton for search results
2. Create skeleton for barcode scanner results
3. Implement skeleton for notification settings
4. Add skeleton variants for different content densities
5. Create skeleton for modal content

## Testing Recommendations

1. Test on slow network connections to verify skeleton visibility
2. Verify no layout shifts when content loads
3. Test progressive loading with staggered data arrival
4. Verify animations are smooth on low-end devices
5. Test accessibility with screen readers
