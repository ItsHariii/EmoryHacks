# WeekTransitionModal Component

A celebratory modal component that displays when a user transitions to a new pregnancy week. Features animated entrance, confetti particles, and developmental milestones.

## Features

- **Full-screen modal** with semi-transparent background
- **Animated week number** entrance with scale and fade effects
- **Confetti/sparkle particle animation** using MaterialCommunityIcons
- **Developmental milestone** display for each week
- **AsyncStorage integration** to track dismissed weeks
- **Accessible** with proper ARIA labels and hints

## Usage

```tsx
import { WeekTransitionModal, shouldShowWeekTransition } from './components/WeekTransitionAnimation';

function MyComponent() {
  const [showTransition, setShowTransition] = useState(false);
  const currentWeek = 24;

  useEffect(() => {
    // Check if we should show the transition
    shouldShowWeekTransition(currentWeek).then(shouldShow => {
      setShowTransition(shouldShow);
    });
  }, [currentWeek]);

  return (
    <WeekTransitionModal
      visible={showTransition}
      week={currentWeek}
      onDismiss={() => setShowTransition(false)}
    />
  );
}
```

## Props

### WeekTransitionModal

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `week` | `number` | Yes | Current pregnancy week (1-40) |
| `onDismiss` | `() => void` | Yes | Callback when user dismisses modal |

## Helper Functions

### `shouldShowWeekTransition(currentWeek: number): Promise<boolean>`

Checks if the week transition modal should be shown based on the last seen week stored in AsyncStorage.

**Parameters:**
- `currentWeek` - The current pregnancy week

**Returns:**
- `Promise<boolean>` - True if the transition should be shown

**Example:**
```tsx
const shouldShow = await shouldShowWeekTransition(25);
if (shouldShow) {
  setShowTransition(true);
}
```

## Developmental Milestones

The component includes developmental milestones for weeks 4-40, with key information about baby's development at each stage. If a specific week doesn't have a milestone, it uses the closest available week's milestone.

## Animation Details

1. **Background Fade**: 300ms fade-in for semi-transparent overlay
2. **Week Number Scale**: Spring animation with bounce effect
3. **Content Fade**: 400ms fade-in for milestone text and button
4. **Particle Animation**: 20 particles (stars, hearts, sparkles) animate outward from center with rotation and fade

## AsyncStorage

The component stores the dismissed week in AsyncStorage under the key `'last_seen_week'`. This ensures the transition is only shown once per week change.

## Accessibility

- Modal has proper `onRequestClose` handler
- Button includes `accessibilityLabel` and `accessibilityHint`
- All text is readable with proper contrast ratios
- Touch targets meet minimum 44x44 pixel requirement

## Design Alignment

Follows the enhanced frontend UX design guidelines:
- Uses theme colors (primary, surface, text)
- Implements smooth animations (300-400ms)
- Uses MaterialCommunityIcons for consistency
- Applies proper spacing and shadows from theme
- Maintains warm, supportive visual language
