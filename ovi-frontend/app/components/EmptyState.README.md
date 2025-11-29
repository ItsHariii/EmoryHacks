# EmptyState Component

A reusable empty state component that provides supportive, encouraging messaging when there's no content to display.

## Features

- **Large Icon**: Displays a supportive icon in a soft circular container (large size)
- **Friendly Messaging**: Headline and description with warm, encouraging language
- **Optional Action**: Primary action button to help users get started
- **Smooth Animation**: Fade-in and slide-up entrance animation (10-12px movement)
- **Accessible**: Proper accessibility labels and hints

## Usage

```tsx
import { EmptyState } from '../components/EmptyState';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

// Basic usage
<EmptyState
  icon={FEATURE_ICONS.food}
  headline="No meals logged today"
  description="Ready to add your first meal? Track your nutrition to see your progress."
/>

// With action button
<EmptyState
  icon={FEATURE_ICONS.journal}
  headline="Start your pregnancy journal today"
  description="Track your mood, symptoms, and wellness journey throughout your pregnancy."
  actionLabel="Create First Entry"
  onAction={() => navigation.navigate('JournalEntry')}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `IconName` | Yes | MaterialCommunityIcons icon name to display |
| `headline` | `string` | Yes | Main headline text (friendly and encouraging) |
| `description` | `string` | Yes | Descriptive text explaining the empty state |
| `actionLabel` | `string` | No | Label for the action button |
| `onAction` | `() => void` | No | Callback when action button is pressed |
| `style` | `ViewStyle` | No | Additional styles for the container |

## Design Guidelines

### Language Tone
- Use warm, encouraging language
- Avoid negative words like "empty", "nothing", "no data"
- Focus on the positive action users can take
- Examples:
  - ✅ "Ready to add your first meal?"
  - ✅ "Let's start tracking your nutrition"
  - ❌ "No data available"
  - ❌ "Nothing to show"

### Icon Selection
- Choose icons that represent the feature or action
- Use outline variants for a softer look
- Common icons:
  - Food logging: `food-apple-outline`, `silverware-fork-knife`
  - Journal: `book-open-outline`, `note-text-outline`
  - Search: `magnify`, `food-variant`
  - Dashboard: `home-outline`, `chart-line`

### Action Button
- Only include if there's a clear next step
- Use action-oriented labels: "Get Started", "Add Entry", "Log Meal"
- Make the action specific to the context

## Examples

### Dashboard Empty State
```tsx
<EmptyState
  icon="home-outline"
  headline="Welcome! Let's start tracking your nutrition"
  description="Begin your pregnancy nutrition journey by logging your first meal or creating a journal entry."
  actionLabel="Get Started"
  onAction={handleGetStarted}
/>
```

### Food Log Empty State
```tsx
<EmptyState
  icon="food-apple-outline"
  headline="No meals logged today"
  description="Ready to add your first meal? Track your nutrition to see your progress and reach your goals."
  actionLabel="Log Your First Meal"
  onAction={() => navigation.navigate('FoodLogging')}
/>
```

### Journal Empty State
```tsx
<EmptyState
  icon="book-open-outline"
  headline="Start your pregnancy journal today"
  description="Track your mood, symptoms, and wellness journey. Your entries help you understand patterns and share with your healthcare provider."
  actionLabel="Create First Entry"
  onAction={() => navigation.navigate('JournalEntry')}
/>
```

### Search Results Empty State
```tsx
<EmptyState
  icon="magnify"
  headline="No foods found"
  description="Try a different search term or check your spelling. You can also scan a barcode to find products quickly."
  actionLabel="Scan Barcode"
  onAction={() => navigation.navigate('BarcodeScanner')}
/>
```

### Micronutrients Empty State
```tsx
<EmptyState
  icon="chart-line"
  headline="Log some meals to see your nutrient breakdown"
  description="Once you start tracking your meals, you'll see detailed insights about your vitamin and mineral intake."
  actionLabel="Log a Meal"
  onAction={() => navigation.navigate('FoodLogging')}
/>
```

## Animation

The component automatically animates on mount with:
- Fade-in from 0 to 1 opacity
- Slide-up from 12px below to final position
- 300ms duration with ease-out easing
- 100ms delay for better visual effect

## Accessibility

The component includes:
- Proper text hierarchy for screen readers
- Accessible button with label and hint
- Semantic structure for easy navigation
- Support for dynamic text sizing

## Styling

The component uses the theme system for:
- Colors: `primaryLight` background, `primary` icon color
- Spacing: Consistent padding and margins
- Typography: Theme font sizes and weights
- Animation: Theme animation durations

You can override styles using the `style` prop for custom layouts.
