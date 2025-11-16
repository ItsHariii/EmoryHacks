# Icon System

A comprehensive icon system for the Aurea app following the visual design guide with consistent styling, animations, and color usage.

## Components

### IconWrapper

A basic wrapper component that places MaterialCommunityIcons in soft circular or rounded-square containers.

```tsx
import { IconWrapper } from './components/icons';

<IconWrapper
  name="heart-outline"
  size="medium"
  context="card"
  backgroundColor="#F5D5D8"
  iconColor="#4A4A4A"
  shape="circular"
/>
```

**Props:**
- `name`: Icon name from MaterialCommunityIcons
- `size`: 'small' (16px) | 'medium' (22px) | 'large' (32px)
- `context`: 'card' (14px padding) | 'badge' (8px padding) | 'button' (12px padding)
- `backgroundColor`: Background color (defaults to pale rose #F5D5D8)
- `iconColor`: Icon color (defaults to text.primary)
- `shape`: 'circular' | 'rounded-square'

### IconBadge

An interactive icon component with press animations and optional gradient ring backdrop.

```tsx
import { IconBadge } from './components/icons';

<IconBadge
  name="baby-face-outline"
  size="large"
  backgroundColor="#F9ECD4"
  iconColor="#4A4A4A"
  shape="circular"
  withGradientRing={true}
  onPress={() => console.log('Pressed!')}
  accessibilityLabel="Pregnancy week"
/>
```

**Props:**
- All IconWrapper props, plus:
- `onPress`: Optional press handler (enables touch interaction)
- `withGradientRing`: Adds subtle gradient ring backdrop for key features
- `accessibilityLabel`: Accessibility label
- `accessibilityHint`: Accessibility hint

**Animation:**
- Scales down to 95% on press with spring-back animation

## Icon Constants

Pre-defined icon mappings for consistent usage across the app.

```tsx
import {
  TRIMESTER_ICONS,
  MACRONUTRIENT_ICONS,
  MICRONUTRIENT_ICONS,
  SAFETY_STATUS_ICONS,
  MOOD_ICONS,
  FEATURE_ICONS,
  ICON_COLORS,
  ICON_BACKGROUNDS,
} from './components/icons';

// Use trimester icon
const trimesterIcon = TRIMESTER_ICONS[2]; // 'flower-outline'

// Use macronutrient icon
const proteinIcon = MACRONUTRIENT_ICONS.protein; // 'food-drumstick'

// Use safety status icon
const safeIcon = SAFETY_STATUS_ICONS.safe; // 'check-circle-outline'

// Use mood icon
const happyIcon = MOOD_ICONS[4]; // 'emoticon-happy-outline'

// Use feature icon
const searchIcon = FEATURE_ICONS.search; // 'magnify'
```

### Available Icon Sets

**Trimester Icons:**
- T1: `sprout`
- T2: `flower-outline`
- T3: `baby-face-outline`

**Macronutrient Icons:**
- calories: `fire`
- protein: `food-drumstick`
- carbs: `bread-slice`
- fat: `food-apple`

**Micronutrient Icons:**
- vitamin_d: `white-balance-sunny`
- dha: `fish`
- folate: `leaf`
- iron: `weight-lifter`
- calcium: `bone`
- choline: `brain`
- vitamin_b12: `pill`
- magnesium: `lightning-bolt`

**Safety Status Icons:**
- safe: `check-circle-outline`
- limited: `alert-circle-outline`
- avoid: `close-circle-outline`

**Mood Icons (1-5):**
- 1: `emoticon-sad-outline`
- 2: `emoticon-frown-outline`
- 3: `emoticon-neutral-outline`
- 4: `emoticon-happy-outline`
- 5: `emoticon-excited-outline`

## Color Guidelines

Use only 2-3 colors from the theme:

```tsx
import { ICON_COLORS, ICON_BACKGROUNDS } from './components/icons';

// Icon colors
ICON_COLORS.primary    // Deep plum (#4A4A4A) - most icons
ICON_COLORS.accent     // Soft rose (#E8B4B8) - highlighted/active
ICON_COLORS.secondary  // Muted sky blue (#B8D4E8) - secondary actions

// Background colors
ICON_BACKGROUNDS.paleRose   // #F5D5D8
ICON_BACKGROUNDS.cream      // #F9ECD4
ICON_BACKGROUNDS.lightBlue  // #D5E8F5
ICON_BACKGROUNDS.white      // #FFFFFF
```

## Animation Utilities

Reusable animation helpers for consistent micro-animations.

```tsx
import {
  createScaleAnimation,
  createFadeInSlideUpAnimation,
  createPulseAnimation,
  useFadeInSlideUp,
} from './utils/animations';

// In a component
const { opacity, translateY, animate } = useFadeInSlideUp(100);

useEffect(() => {
  animate();
}, []);

<Animated.View style={{ opacity, transform: [{ translateY }] }}>
  {/* Your content */}
</Animated.View>
```

### Available Animations

- **Scale Down/Up**: 95% scale with spring back (for press interactions)
- **Fade In/Out**: Smooth opacity transitions
- **Slide Up**: 10-12px upward movement with fade-in
- **Pulse**: Subtle scale pulse for progress indicators
- **Progress Fill**: Smooth width animation for progress bars
- **Staggered**: Animate multiple items with delay

## Design Principles

1. **Consistent Icon Family**: Use only MaterialCommunityIcons
2. **Limited Color Palette**: 2-3 colors maximum (deep plum, soft rose, muted sky blue)
3. **Soft Containers**: Icons always sit in circular or rounded-square backgrounds
4. **Proper Padding**: 
   - Card icons: 12-16px padding
   - Badge icons: 6-8px padding
   - Button icons: 10-12px padding
5. **Never Touch Edges**: Icons always have breathing room
6. **Micro-animations**: All interactions feel alive but not distracting
7. **Gradient Rings**: Subtle backdrop for key features only
8. **Accessibility**: All interactive icons have proper labels and hints

## Examples

### Pregnancy Week Display

```tsx
<IconBadge
  name={TRIMESTER_ICONS[trimester]}
  size="large"
  backgroundColor={ICON_BACKGROUNDS.cream}
  iconColor={ICON_COLORS.primary}
  withGradientRing={true}
  accessibilityLabel={`Trimester ${trimester}`}
/>
```

### Macronutrient Card Icon

```tsx
<IconWrapper
  name={MACRONUTRIENT_ICONS.protein}
  size="medium"
  context="card"
  backgroundColor={ICON_BACKGROUNDS.paleRose}
  iconColor={ICON_COLORS.primary}
  shape="circular"
/>
```

### Safety Status Badge

```tsx
<IconBadge
  name={SAFETY_STATUS_ICONS[status]}
  size="small"
  context="badge"
  backgroundColor={status === 'safe' ? ICON_BACKGROUNDS.lightBlue : ICON_BACKGROUNDS.cream}
  iconColor={status === 'safe' ? ICON_COLORS.success : ICON_COLORS.warning}
  onPress={() => showSafetyDetails()}
  accessibilityLabel={`Food safety: ${status}`}
/>
```

### Mood Selector

```tsx
{[1, 2, 3, 4, 5].map((mood) => (
  <IconBadge
    key={mood}
    name={MOOD_ICONS[mood]}
    size="medium"
    backgroundColor={selectedMood === mood ? ICON_BACKGROUNDS.paleRose : ICON_BACKGROUNDS.white}
    iconColor={selectedMood === mood ? ICON_COLORS.accent : ICON_COLORS.primary}
    onPress={() => setSelectedMood(mood)}
    accessibilityLabel={`Mood level ${mood}`}
  />
))}
```
