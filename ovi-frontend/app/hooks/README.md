# Custom Hooks Documentation

This directory contains custom React hooks for managing data and state in the Aurea frontend application.

## Available Hooks

### useNutritionData
Fetches and manages nutrition data with caching.

**Usage:**
```typescript
import { useNutritionData } from './hooks';

const { summary, targets, loading, error, refresh } = useNutritionData(date);
```

**Features:**
- Fetches nutrition summary from `/food/nutrition-summary`
- Fetches nutrition targets from `/users/nutrition-targets`
- 5-minute TTL caching using AsyncStorage
- Loading and error states
- Manual refresh function

---

### usePregnancyProgress
Calculates and tracks pregnancy progress with week change detection.

**Usage:**
```typescript
import { usePregnancyProgress } from './hooks';

const { pregnancyInfo, weekChanged, dismissWeekChange, loading, error } = usePregnancyProgress();
```

**Features:**
- Calculates current week from due date
- Determines trimester (1-13, 14-27, 28-40)
- Detects week changes via AsyncStorage
- Provides week-specific tips
- Triggers week transition animations

**Returns:**
- `pregnancyInfo`: Object with week, trimester, daysUntilDue, daysPassed, weekTip, trimesterName
- `weekChanged`: Boolean indicating if week has changed since last visit
- `dismissWeekChange`: Function to dismiss week change notification

---

### useMicronutrientCalculator
Calculates micronutrient totals and percentages from nutrition data.

**Usage:**
```typescript
import { useMicronutrientCalculator } from './hooks';

const micronutrients = useMicronutrientCalculator(summary, targets);
```

**Features:**
- Extracts 8 key micronutrients: folate, iron, calcium, DHA, choline, vitamin D, vitamin B12, magnesium
- Calculates percentage of target for each
- Includes importance descriptions and food sources
- Returns formatted data ready for chart display

**Returns:**
Array of `MicronutrientData` objects with:
- name, current, target, unit
- importance (description)
- foodSources (array of strings)
- percentOfTarget (number)

---

### useOfflineSync
Manages offline functionality and data synchronization.

**Usage:**
```typescript
import { useOfflineSync } from './hooks';

const { isOnline, queueAction, syncPendingActions, pendingActions } = useOfflineSync();
```

**Features:**
- Monitors network connectivity using NetInfo
- Queues actions in AsyncStorage when offline
- Auto-syncs pending actions when connection restored
- Provides online/offline status

**Queue Action Example:**
```typescript
await queueAction({
  type: 'food_log',
  endpoint: '/food/log',
  method: 'POST',
  data: { food_id: '123', quantity: 1, meal_type: 'breakfast' }
});
```

---

### usePregnancyWeek (Legacy)
Original pregnancy week hook - consider using `usePregnancyProgress` for new implementations.

---

### useBarcodeScanner
Manages barcode scanning functionality.

---

### useNotifications
Manages notification preferences and scheduling.

---

## Type Definitions

All hooks use types defined in `app/types/index.ts`:
- `NutritionSummary`
- `NutritionTargets`
- `PregnancyInfo`
- `MicronutrientData`
- `PendingAction`

## Dependencies

- `@react-native-async-storage/async-storage` - Local storage
- `@react-native-community/netinfo` - Network connectivity monitoring
- `axios` - HTTP client (via api service)

## Best Practices

1. **Caching**: useNutritionData implements 5-minute TTL caching to reduce API calls
2. **Error Handling**: All hooks provide error states for graceful error handling
3. **Loading States**: All async hooks provide loading states for UI feedback
4. **Offline Support**: Use useOfflineSync to queue actions when offline
5. **Memoization**: useMicronutrientCalculator uses useMemo for performance

## Testing

When testing components that use these hooks, mock the hooks appropriately:

```typescript
jest.mock('./hooks', () => ({
  useNutritionData: () => ({
    summary: mockSummary,
    targets: mockTargets,
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));
```
