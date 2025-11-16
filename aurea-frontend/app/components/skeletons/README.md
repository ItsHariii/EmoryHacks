# Skeleton Loading Components

This directory contains skeleton screen components that provide premium loading experiences throughout the Aurea app. Skeleton screens improve perceived performance by showing content placeholders while data is being fetched.

## Overview

Skeleton screens use a shimmer animation effect (gradient moving left to right) to indicate loading state. They match the actual content layout to avoid layout shifts when real data loads.

## Components

### Base Components (SkeletonLoader.tsx)

- **SkeletonLoader**: Base skeleton component with shimmer animation
- **SkeletonCard**: Generic card skeleton
- **SkeletonPregnancyWeek**: Pregnancy week display skeleton
- **SkeletonMacroCard**: Macronutrient card skeleton
- **SkeletonMicronutrientChart**: Micronutrient chart skeleton
- **SkeletonFoodEntry**: Food entry list item skeleton
- **SkeletonJournalEntry**: Journal entry card skeleton
- **SkeletonProfileInfo**: Profile information section skeleton

### Screen Skeletons

- **DashboardSkeleton**: Full dashboard loading state
- **FoodListSkeleton**: Food logging list loading state
- **JournalListSkeleton**: Journal entries list loading state
- **ProfileSkeleton**: Profile screen loading state

## Usage

### Basic Usage

```typescript
import { SkeletonLoader } from '../components/SkeletonLoader';

// Simple skeleton
<SkeletonLoader width="100%" height={20} />

// Custom styling
<SkeletonLoader 
  width={200} 
  height={40} 
  borderRadius={12}
  style={{ marginBottom: 16 }}
/>
```

### Screen Skeletons

```typescript
import { DashboardSkeleton } from '../components/skeletons';

// Show skeleton while loading
if (loading) {
  return <DashboardSkeleton />;
}
```

### Progressive Loading

Progressive loading shows skeleton for sections that are still loading while displaying loaded content:

```typescript
// Show skeleton for pregnancy section if still loading
{pregnancyLoading && !pregnancyInfo ? (
  <View style={styles.section}>
    <SkeletonPregnancyWeek />
  </View>
) : pregnancyInfo ? (
  <PregnancyWeekDisplay {...pregnancyInfo} />
) : null}
```

## Implementation Details

### Shimmer Animation

The shimmer effect is created using:
1. Animated.Value that loops from 0 to 1
2. translateX interpolation that moves gradient from -300 to 300
3. 1200ms duration for smooth, calming animation

### Design Principles

1. **Match Real Content**: Skeleton dimensions match actual content to prevent layout shifts
2. **Fade-in Transition**: Real content fades in smoothly when loaded
3. **Progressive Loading**: Load critical content first (user info, pregnancy week)
4. **Consistent Styling**: Use theme colors and spacing for consistency

### Performance

- Animations use `useNativeDriver: true` for 60fps performance
- Skeleton components are lightweight and render quickly
- Progressive loading reduces perceived wait time

## Screen Integration

### Dashboard Screen

```typescript
// Initial load: Show full skeleton
if (isInitialLoading) {
  return <DashboardSkeleton />;
}

// Progressive load: Show skeleton for each section
{pregnancyLoading ? <SkeletonPregnancyWeek /> : <PregnancyWeekDisplay />}
{nutritionLoading ? <SkeletonMacroCard /> : <MacronutrientCard />}
```

### Journal Screen

```typescript
if (loading) {
  return (
    <SafeAreaView>
      <HeaderBar title="My Journal" subtitle="Loading..." />
      <JournalListSkeleton />
    </SafeAreaView>
  );
}
```

### Profile Screen

```typescript
if (loading) {
  return (
    <SafeAreaView>
      <HeaderBar title="Profile" subtitle="Loading..." />
      <ProfileSkeleton />
    </SafeAreaView>
  );
}
```

### Food Logging Screen

```typescript
if (loading && foodEntries.length === 0) {
  return (
    <SafeAreaView>
      <View style={styles.header}>
        <Text>Loading your meals...</Text>
      </View>
      <FoodListSkeleton />
    </SafeAreaView>
  );
}
```

## Accessibility

Skeleton screens maintain accessibility by:
- Keeping header bars visible with loading messages
- Using proper semantic structure
- Providing context through subtitle text
- Ensuring smooth transitions to real content

## Requirements Met

This implementation satisfies:
- **Requirement 12.2**: Premium loading experiences with skeleton screens
- **Requirement 12.5**: Encouraging loading messages and smooth transitions
- **Requirement 12.1**: Progressive loading of critical content first

## Future Enhancements

Potential improvements:
- Add skeleton variants for different content densities
- Implement skeleton for search results
- Add skeleton for barcode scanner results
- Create skeleton for notification settings
