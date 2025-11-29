# MicronutrientChart Component

A comprehensive micronutrient tracking component with horizontal progress bars, animations, and detailed nutrient information.

## Features

- **Horizontal Bar Chart**: Displays 8 key pregnancy micronutrients with visual progress bars
- **Color-Coded Status**: Red (<70%), Yellow (70-90%), Green (>90%)
- **Interactive Icons**: Small supportive icons (14-16px) with subtle pulse animations
- **Expandable Details**: Tap any nutrient to view importance and food sources
- **Smart Suggestions**: Automatically shows suggestions for nutrients below 70%
- **Smooth Animations**: Fade-in, slide-up, and scale animations throughout

## Usage

```tsx
import { MicronutrientChart } from '../components/MicronutrientChart';
import { useMicronutrientCalculator } from '../hooks/useMicronutrientCalculator';

// In your component
const { summary, targets } = useNutritionData();
const micronutrients = useMicronutrientCalculator(summary, targets);

<MicronutrientChart 
  nutrients={micronutrients}
  onNutrientPress={(nutrient) => console.log('Tapped:', nutrient.name)}
/>
```

## Props

### MicronutrientChartProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `nutrients` | `MicronutrientData[]` | Yes | Array of micronutrient data |
| `onNutrientPress` | `(nutrient: MicronutrientData) => void` | No | Callback when nutrient is tapped |

### MicronutrientData Type

```typescript
interface MicronutrientData {
  name: string;              // e.g., "Folate"
  current: number;           // Current intake value
  target: number;            // Target intake value
  unit: string;              // e.g., "mcg", "mg"
  importance: string;        // Why this nutrient matters
  foodSources: string[];     // List of food sources
  percentOfTarget: number;   // Calculated percentage
}
```

## Visual Design

- **Icons**: MaterialCommunityIcons with 14-16px size in soft circular containers
- **Colors**: Theme-based with semantic color coding (success/warning/error)
- **Animations**: 
  - Staggered fade-in and slide-up on mount (50ms delay between bars)
  - Progress bar fill animation (400ms)
  - Subtle pulse for nutrients at >90% target
  - Scale-down (95%) on press with spring back
- **Spacing**: 12-16px padding around icons, proper margins between elements

## Components

### NutrientBar
Individual nutrient bar with icon, name, progress bar, and values.

### LowNutrientSuggestions
Automatically displayed card showing food suggestions for nutrients below 70% of target.

### NutrientDetailModal
Bottom sheet modal with:
- Large icon in circular container
- Current/Target/Progress stats
- Importance explanation
- Food sources list with icons
- Close button

## Accessibility

- All interactive elements have proper `accessibilityRole` and `accessibilityLabel`
- Minimum 44x44 touch targets
- Screen reader friendly descriptions
- Proper color contrast ratios

## Integration with Dashboard

Replace the old `NutrientChart` component:

```tsx
// Old
import { NutrientChart } from '../components/NutrientChart';

// New
import { MicronutrientChart } from '../components/MicronutrientChart';
import { useMicronutrientCalculator } from '../hooks/useMicronutrientCalculator';

// In component
const micronutrients = useMicronutrientCalculator(nutritionSummary, nutritionTargets);

<MicronutrientChart nutrients={micronutrients} />
```

## Requirements Met

- ✅ 3.2: Display current intake values with visual indicators
- ✅ 3.3: Educational modal with importance and food sources
- ✅ 3.4: Color-coded bars showing progress toward targets
- ✅ 3.5: Gentle suggestions for low nutrients
- ✅ 4.4: Encouraging, supportive language throughout
