# JournalMoodSelector Component

A visual mood/quality selector component that uses expressive MaterialCommunityIcons instead of emojis. Designed for journal entries to capture mood, sleep quality, and energy levels with a warm, supportive interface.

## Features

- **Icon-Based Selection**: Uses MaterialCommunityIcons emoticon icons (outline and filled variants)
- **5-Level Scale**: Provides 5 distinct levels from very sad to very happy
- **Visual Feedback**: Selected icons show filled variant with soft circular background
- **Smooth Animations**: Scale-down animation (95%) on selection with spring-back effect
- **Accessibility**: Full accessibility support with proper labels and hints
- **Customizable Label**: Supports custom label text with neutral, warm language

## Usage

```tsx
import { JournalMoodSelector } from '../components/JournalMoodSelector';

// Basic usage for mood
<JournalMoodSelector 
  value={mood} 
  onChange={setMood}
  label="How are you feeling today?"
/>

// For sleep quality
<JournalMoodSelector 
  value={sleepQuality} 
  onChange={setSleepQuality}
  label="How well did you sleep?"
/>

// For energy level
<JournalMoodSelector 
  value={energyLevel} 
  onChange={setEnergyLevel}
  label="What's your energy level?"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number \| null` | Yes | - | Currently selected mood level (1-5) |
| `onChange` | `(mood: number) => void` | Yes | - | Callback when mood is selected |
| `label` | `string` | No | `"How are you feeling?"` | Label text displayed above selector |

## Mood Levels

The component uses 5 mood levels with corresponding icons:

1. **Very Sad** - `emoticon-sad-outline` / `emoticon-sad`
2. **Sad** - `emoticon-frown-outline` / `emoticon-frown`
3. **Neutral** - `emoticon-neutral-outline` / `emoticon-neutral`
4. **Happy** - `emoticon-happy-outline` / `emoticon-happy`
5. **Very Happy** - `emoticon-excited-outline` / `emoticon-excited`

## Visual Design

- **Icon Size**: Medium (20-22px) using IconBadge component
- **Container**: Soft circular background with theme colors
- **Selected State**: Filled icon variant with pale rose background (#F5D5D8)
- **Unselected State**: Outline icon variant with cream background (#F9ECD4)
- **Animation**: 95% scale-down on press with spring-back (speed: 50, bounciness: 8)
- **Spacing**: Icons arranged in a row with consistent spacing (8px gap)

## Accessibility

The component follows WCAG 2.1 AA guidelines:

- Minimum 44x44 touch targets for each icon
- Proper `accessibilityRole="button"` for each selectable icon
- Descriptive `accessibilityLabel` for each mood level
- `accessibilityHint` explaining the action
- `accessibilityState` indicating selected state
- Screen reader friendly labels

## Integration

This component is used in:
- **JournalEntryScreen**: For mood, sleep quality, and energy level tracking
- **Journal History**: For displaying mood indicators in entry summaries

## Design System Compliance

- Uses IconBadge component for consistent icon presentation
- Follows theme color palette (primary, accent, backgrounds)
- Implements micro-animations from animations utility
- Maintains visual consistency with other icon-based components
- No emojis - uses only MaterialCommunityIcons family

## Related Components

- `IconBadge` - Base component for icon containers
- `MoodSelector` - Legacy emoji-based selector (deprecated)
- `SymptomPicker` - Multi-select component for symptoms
