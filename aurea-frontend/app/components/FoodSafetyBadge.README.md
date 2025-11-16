# FoodSafetyBadge Component

A pill-shaped badge component that displays food safety status during pregnancy with color-coded indicators and detailed safety information.

## Features

- **Visual Status Indicators**: Color-coded badges (green for safe, yellow for limited, red for avoid)
- **MaterialCommunityIcons**: Uses appropriate circle icons (check-circle-outline, alert-circle-outline, close-circle-outline)
- **Interactive**: Tappable with scale animation (95% scale down with spring back)
- **Detailed Modal**: Shows safety notes from backend when tapped
- **Accessibility**: Full accessibility support with proper labels and hints
- **Small Icon Size**: Uses 14-16px icons as per design guidelines

## Usage

### Basic Usage

```tsx
import { FoodSafetyBadge } from './components/FoodSafetyBadge';

// Safe food
<FoodSafetyBadge status="safe" />

// Limited food with notes
<FoodSafetyBadge 
  status="limited" 
  notes="Consume in moderation. High mercury content may be harmful in large quantities."
/>

// Avoid food with notes
<FoodSafetyBadge 
  status="avoid" 
  notes="Raw or undercooked eggs may contain salmonella bacteria which can cause food poisoning."
/>
```

### With Custom Press Handler

```tsx
<FoodSafetyBadge 
  status="safe" 
  notes="This food is safe to consume during pregnancy."
  onPress={() => console.log('Custom action')}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `'safe' \| 'limited' \| 'avoid'` | Yes | The safety status of the food |
| `notes` | `string` | No | Detailed safety information from backend |
| `onPress` | `() => void` | No | Custom press handler (overrides default modal behavior) |

## Status Colors

- **Safe**: Soft green (#A8D5BA) with check-circle-outline icon
- **Limited**: Soft orange (#F4C790) with alert-circle-outline icon
- **Avoid**: Soft red (#E8A4A4) with close-circle-outline icon

## Design Specifications

- **Icon Size**: 15px (within 14-16px range)
- **Icon Padding**: 6px spacing between icon and label
- **Badge Padding**: 4px vertical, 8px horizontal
- **Border Radius**: Full (pill-shaped)
- **Animation**: Scale down to 95% on press with spring back

## Modal Features

When tapped (and notes are provided), displays a modal with:
- Status badge with icon
- Full safety notes text
- Warning box for "avoid" status foods
- Close button
- Semi-transparent overlay
- Fade animation

## Accessibility

- Proper `accessibilityRole` for button/text
- Descriptive `accessibilityLabel` with status
- `accessibilityHint` for interactive badges
- Screen reader friendly

## Requirements Satisfied

- **9.1**: Display safety status with color-coded visual indicators
- **9.2**: Use color-coding (green/yellow/red) for status
- **9.3**: Display detailed safety notes in modal
- **9.5**: Show safety information from backend without modification

## Example Integration

```tsx
// In FoodLoggingScreen or FoodEntryCard
import { FoodSafetyBadge } from '../components/FoodSafetyBadge';

const FoodCard = ({ food }) => (
  <View style={styles.card}>
    <Text style={styles.foodName}>{food.name}</Text>
    <FoodSafetyBadge 
      status={food.safety_status} 
      notes={food.safety_notes}
    />
  </View>
);
```
