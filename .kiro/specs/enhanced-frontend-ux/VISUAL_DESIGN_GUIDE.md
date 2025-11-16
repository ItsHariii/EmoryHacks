# Visual Design Guide - Aurea App

This guide provides the visual and structural directions for creating a clean, premium, wellness-brand look for the Aurea pregnancy nutrition app.

## 🎨 Core Design Principles

### 1. Consistent Icon System
**Use one icon family across the entire app**

- **Icon Library**: MaterialCommunityIcons from @expo/vector-icons
- **Style**: Minimalist, rounded icons with gentle curves and thin line weight
- **No harsh edges**: All icons should feel soft and approachable
- **No emojis**: Replace all emojis with proper icons for a professional look

### 2. Icon Color Palette
**Limit to 2-3 colors from the theme**

- **Deep plum** (`theme.colors.text.primary` - #4A4A4A): Default icon color
- **Soft rose** (`theme.colors.primary` - #E8B4B8): Accent icons
- **Muted sky blue** (`theme.colors.secondary` - #B8D4E8): Highlight icons

This prevents visual clutter and maintains brand consistency.

### 3. Icon Sizing Hierarchy
**Three sizes across the app**

- **Small (14-16px)**: Tags, badges, inline indicators
- **Medium (20-22px)**: Card headers, navigation, primary actions
- **Large (28-32px)**: Feature moments, hero elements (optional)

Never mix too many sizes - keeps everything visually rhythmic.

### 4. Icon Containers
**Every icon sits in a soft shape**

- Place icons inside circular or rounded-square containers
- Use pale rose (#F5D5D8) or warm cream (#F9ECD4) as background
- This makes icons feel intentional and gives cards a premium, polished look

### 5. Icon Spacing Standards
**Consistent padding around all icons**

- **Card icons**: 12-16px padding
- **Badge icons**: 6-8px padding  
- **Button icons**: 10-12px padding
- **Rule**: Icons never touch edges or sit too close to text

## 🌿 Component-Specific Icon Guidelines

### PregnancyWeekCard
**Trimester Icons** (replace emojis)
- **Trimester 1**: `sprout` - tiny seed icon
- **Trimester 2**: `flower-outline` - subtle flower outline
- **Trimester 3**: `baby-face-outline` - baby face outline
- Keep them minimal and outlined, not filled
- Place in soft circular container with theme background

### MacronutrientCard
**Nutrient Icons** (clean, recognizable)
- **Calories**: `flame` - fire icon
- **Protein**: `food-drumstick` or `molecule` - protein symbol
- **Carbs**: `bread-slice` - bread outline
- **Fat**: `food-apple` or `avocado` - healthy fat symbol
- Each icon inside soft circular backdrop using theme colors

### MicronutrientChart
**Micronutrient Icons** (supportive, small, subtle)
- **Vitamin D**: `white-balance-sunny` - sun icon
- **DHA**: `fish` - fish icon
- **Folate**: `leaf` - leaf icon
- **Iron**: `weight-lifter` - strength icon
- **Calcium**: `bone` - bone icon
- **Choline**: `brain` - brain icon
- **Vitamin B12**: `pill` - supplement icon
- **Magnesium**: `lightning-bolt` - energy icon
- Size: 14-16px, minimal and outlined

### JournalMoodSelector
**Mood Icons** (expressive outline emoticons)
- **Level 1 (Very Sad)**: `emoticon-sad-outline`
- **Level 2 (Sad)**: `emoticon-frown-outline`
- **Level 3 (Neutral)**: `emoticon-neutral-outline`
- **Level 4 (Happy)**: `emoticon-happy-outline`
- **Level 5 (Very Happy)**: `emoticon-excited-outline`
- Arranged in a row
- Selected icon becomes filled or highlighted with soft circular background
- Size: 20-22px (medium)

### FoodSafetyBadge
**Safety Status Icons** (circle icons matching tone)
- **Safe**: `check-circle-outline` - checkmark in circle
- **Limited**: `alert-circle-outline` - warning in circle
- **Avoid**: `close-circle-outline` - X in circle
- Place icon on left of label inside pill badge
- Size: 14-16px (small)
- Padding: 6-8px

### LoadingSpinner
**Loading Context Icons**
- **General**: `loading` - spinner
- **Food data**: `food-apple` - food icon
- **Nutrition**: `chart-line` - chart icon
- Pair with encouraging text

### Tips and Suggestions
**Supportive Icons**
- **Tip**: `lightbulb-outline` - idea icon
- **Suggestion**: `hand-heart` - caring gesture
- **Warning**: `alert-circle-outline` - gentle alert
- **Success**: `check-circle` - achievement

## ✨ Micro-Animations

### Icon Interactions
**On Press**
- Scale down to 95%
- Spring back with bounce
- Duration: 200ms

**On Screen Entry**
- Fade in from 0 to 1 opacity
- Slide up 10-12px
- Duration: 300ms
- Stagger icon groups by 50ms

**Progress Indicators**
- Subtle pulse animation as bars fill
- Icon scales slightly (98-102%) in rhythm
- Smooth, not distracting

### Animation Principles
- All animations should feel alive but not distracting
- Use spring physics for natural movement
- Consistent timing across similar interactions
- Never block user interaction

## 🪞 Visual Brand Signature

### Gradient Ring Backdrop
**Distinctive element for key features**

Apply to:
- Pregnancy week number display
- Macronutrient card set (as a group)
- Page headers with important info

Implementation:
- Soft, faint gradient rings behind icons
- Use theme colors: `primary` to `primaryLight`
- Subtle - just enough to be recognizable
- Creates memorable visual identity

Example:
```
Gradient: radial-gradient(circle, primaryLight 0%, transparent 70%)
Opacity: 0.3-0.5
Radius: 1.5x icon container size
```

## 📐 Layout Principles

### Spacing Rhythm
- Use theme spacing system: 4, 8, 16, 24, 32, 48px
- Maintain consistent gaps between icon and text
- Never let icons touch container edges
- White space is premium - use it generously

### Visual Hierarchy
1. **Primary**: Large icons with gradient backdrop (hero elements)
2. **Secondary**: Medium icons in containers (card headers)
3. **Tertiary**: Small icons inline (badges, tags)

### Card Structure
```
┌─────────────────────────────┐
│  [Icon in circle]  Title    │ ← 12-16px padding
│                              │
│  Content with proper spacing │
│                              │
│  [Action icons]              │ ← 10-12px padding
└─────────────────────────────┘
```

## 🎬 Implementation Checklist

When implementing any component, ensure:

- [ ] Uses MaterialCommunityIcons exclusively
- [ ] Icons are soft, rounded, thin line weight
- [ ] Only 2-3 colors from theme palette
- [ ] Proper size (small/medium/large)
- [ ] Icon sits in soft container (circular/rounded-square)
- [ ] Correct padding (card: 12-16px, badge: 6-8px, button: 10-12px)
- [ ] Micro-animation on interaction
- [ ] No emojis anywhere
- [ ] Accessible labels for all icons
- [ ] Gradient ring for key features (if applicable)

## 🌸 Copy Guidelines

### Text with Icons
- Icons supplement text, never replace it
- Use neutral, warm language
- No symbols or emojis in copy
- Example: "Great job!" not "Great job! 🎉"

### Encouraging Language
- Positive and supportive
- Avoid alarming or negative messaging
- Focus on progress, not perfection
- Examples:
  - ✅ "Try adding these foods..."
  - ✅ "You're making great progress!"
  - ❌ "You're deficient in..."
  - ❌ "Warning: Low intake!"

## 🎯 Quality Standards

### Premium Look Checklist
- [ ] Consistent icon family throughout
- [ ] All icons in soft containers
- [ ] Proper spacing (never touching edges)
- [ ] Smooth micro-animations
- [ ] 2-3 color palette maintained
- [ ] Size hierarchy respected
- [ ] Gradient ring signature present
- [ ] No emojis anywhere
- [ ] Professional, wellness-brand feel

### Before/After Example

**Before (Amateur)**
```
😊 Mood: Happy
Calories: 1500 ⚡
```

**After (Premium)**
```
[emoticon-happy-outline in soft circle] Mood: Happy
[flame icon in soft circle] Calories: 1500
```

## 🚀 Getting Started

1. Install icon library: `npx expo install @expo/vector-icons`
2. Create IconBadge component (task 2.6.3)
3. Define icon mapping constants (task 2.6.2)
4. Replace all emojis with proper icons
5. Add micro-animations to interactions
6. Apply gradient ring to key features
7. Review against quality checklist

---

**Remember**: The difference between a hackathon project and a real product is in these details. Consistency, spacing, and thoughtful icon usage create a premium, memorable experience.
