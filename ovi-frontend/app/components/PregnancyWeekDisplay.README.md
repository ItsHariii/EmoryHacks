# PregnancyWeekDisplay Component

A comprehensive pregnancy week card component that displays the current pregnancy week, trimester information, progress visualization, and week-specific tips.

## Features

- **Large Week Number Display**: Shows the current pregnancy week in a large, prominent font (48px) with a subtle gradient ring backdrop
- **Trimester Information**: Displays trimester name with an elegant icon (sprout for T1, flower-outline for T2, baby-face-outline for T3) in a soft circular container
- **Progress Bar**: Animated horizontal progress bar showing week progress out of 40 weeks with gradient fill
- **Week-Specific Tips**: Displays helpful, encouraging tips relevant to the current pregnancy week
- **Smooth Animations**: Fade-in and slide-up animations on mount, animated progress bar fill
- **Accessibility**: Full accessibility support with proper labels and roles

## Usage

```tsx
import { PregnancyWeekDisplay } from '../components/PregnancyWeekDisplay';

// In your component
<PregnancyWeekDisplay
  week={24}
  trimester={2}
  daysUntilDue={112}
  dueDate="2025-03-15"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `week` | `number` | Yes | Current pregnancy week (1-40) |
| `trimester` | `number` | Yes | Current trimester (1, 2, or 3) |
| `daysUntilDue` | `number` | Yes | Number of days until due date |
| `dueDate` | `string` | No | Due date in ISO format (for future use) |
| `onWeekChange` | `(newWeek: number) => void` | No | Callback when week changes (for future use) |

## Visual Design

The component follows the enhanced UX design guidelines:

- **Color Palette**: Uses soft rose pink (#E8B4B8) for primary elements, warm cream (#F9ECD4) for tip background
- **Shadows**: Large shadow (lg) for card elevation
- **Border Radius**: Extra large (xl) for soft, rounded corners
- **Spacing**: Consistent spacing using theme spacing system (md, lg)
- **Icons**: MaterialCommunityIcons only, no emojis
- **Animations**: Smooth fade-in, slide-up, and progress bar fill animations

## Layout Structure

```
┌─────────────────────────────────────┐
│  PregnancyWeekCard (Card with lg)   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   [Gradient Ring]             │ │
│  │        24                     │ │
│  │       Week                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [Icon] Second Trimester            │
│         112 days until due date     │
│                                     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░  │
│  Week 24 of 40                      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [💡] Baby's lungs are         │ │
│  │      developing. Keep up      │ │
│  │      with iron intake.        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Dependencies

- `expo-linear-gradient`: For gradient effects on progress bar and ring backdrop
- `@expo/vector-icons`: For MaterialCommunityIcons
- Theme system from `../theme`
- Pregnancy calculations from `../utils/pregnancyCalculations`
- Animation utilities from `../utils/animations`
- Icon constants from `./icons/iconConstants`
- Card component from `./Card`
- IconBadge component from `./icons/IconBadge`

## Accessibility

The component includes comprehensive accessibility support:

- Proper `accessibilityRole` for the card ("summary")
- Descriptive `accessibilityLabel` for the week number and overall card
- Individual labels for trimester icon and tip icon
- Screen reader friendly text descriptions

## Animation Details

1. **On Mount**: 
   - Fade-in animation (0 to 1 opacity)
   - Slide-up animation (12px upward movement)
   - Duration: 300ms with ease-out easing

2. **Progress Bar**:
   - Animated fill from 0% to calculated percentage
   - Duration: 400ms with cubic ease-out
   - Gradient fill from primary to primaryDark

## Integration Example

```tsx
import { usePregnancyWeek } from '../hooks/usePregnancyWeek';
import { PregnancyWeekDisplay } from '../components/PregnancyWeekDisplay';

export const DashboardScreen = () => {
  const { pregnancyInfo, loading } = usePregnancyWeek();

  if (loading || !pregnancyInfo) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView>
      <PregnancyWeekDisplay
        week={pregnancyInfo.week}
        trimester={pregnancyInfo.trimester}
        daysUntilDue={pregnancyInfo.daysUntilDue}
      />
      {/* Other dashboard content */}
    </ScrollView>
  );
};
```

## Testing

The component can be tested with various pregnancy weeks and trimesters:

```tsx
// First trimester
<PregnancyWeekDisplay week={8} trimester={1} daysUntilDue={224} />

// Second trimester
<PregnancyWeekDisplay week={20} trimester={2} daysUntilDue={140} />

// Third trimester
<PregnancyWeekDisplay week={35} trimester={3} daysUntilDue={35} />
```

## Notes

- The component automatically fetches week-specific tips from the `pregnancyCalculations` utility
- Trimester icons are automatically selected based on the trimester number
- All animations are optimized for performance using `useNativeDriver` where possible
- The gradient ring backdrop is subtle (30% opacity) to avoid overwhelming the design
