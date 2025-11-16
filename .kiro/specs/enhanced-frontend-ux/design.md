# Design Document

## Overview

This design document outlines the architecture, components, and implementation strategy for creating an exceptional, comforting frontend experience for Aurea, a pregnancy nutrition tracking application. The design prioritizes accurate data display from the backend API, real-time pregnancy progress tracking, comprehensive macro and micronutrient visualization, and a warm, supportive user experience that reduces anxiety.

The frontend is built using React Native with TypeScript, ensuring cross-platform compatibility (iOS and Android) while maintaining a native feel. The design emphasizes smooth animations, intuitive navigation, and gentle, encouraging interactions that make nutrition tracking feel supportive rather than stressful.

**Visual Design**: This implementation follows a premium wellness-brand aesthetic with consistent icon usage, soft containers, and thoughtful micro-animations. See [VISUAL_DESIGN_GUIDE.md](./VISUAL_DESIGN_GUIDE.md) for comprehensive visual and structural directions.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Navigation Layer                          │  │
│  │  (React Navigation - Tab + Stack Navigators)          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Screen Components                         │  │
│  │  Dashboard │ FoodLogging │ Journal │ Profile          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Reusable UI Components                       │  │
│  │  PregnancyWeek │ NutrientChart │ ProgressBar │ etc.  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                      │  │
│  │  Hooks │ Context Providers │ Utilities                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Data Layer                                │  │
│  │  API Services │ Local Storage │ Cache Management      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                     │
│  /users/me │ /food/nutrition-summary │ /journal/entries    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

1. **User Authentication Flow**: User logs in → Token stored in SecureStore → Token attached to all API requests via Axios interceptor
2. **Dashboard Data Flow**: Screen mounts → Fetch user profile → Calculate pregnancy week/trimester → Fetch nutrition summary → Fetch nutrition targets → Fetch journal entries → Display all data
3. **Food Logging Flow**: User searches food → Display results from API → User selects food → Calculate nutrition for serving → User confirms → POST to API → Refresh dashboard
4. **Offline Flow**: User performs action → Check connectivity → If offline, store in AsyncStorage → When online, sync to API → Update UI

## Components and Interfaces

### Core Screen Components

#### 1. Enhanced Dashboard Screen

**Purpose**: Primary screen showing pregnancy progress, nutrition summary, and quick actions

**Key Features**:
- Personalized greeting with user's first name
- Pregnancy week display with visual progress bar
- Macronutrient progress cards with color-coded bars
- Micronutrient tracking section with expandable details
- Today's journal summary (if exists)
- Quick action buttons (Log Food, Scan Barcode, Journal Entry)
- Pull-to-refresh functionality

**Data Sources**:
- `/users/me` - User profile (name, due date, trimester)
- `/users/nutrition-targets` - Trimester-specific targets
- `/food/nutrition-summary` - Today's nutrition data
- `/journal/entries?start_date={today}&end_date={today}` - Today's journal

**State Management**:
```typescript
interface DashboardState {
  user: User | null;
  pregnancyInfo: PregnancyInfo | null;
  nutritionSummary: NutritionSummary | null;
  nutritionTargets: NutritionTargets | null;
  todayJournal: JournalEntry | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}
```

#### 2. Enhanced Food Logging Screen

**Purpose**: Search, select, and log food with accurate nutritional information

**Key Features**:
- Real-time search with debouncing (300ms)
- Food cards showing name, brand, serving size, safety status
- Serving size selector with presets and custom input
- Quantity adjuster with +/- buttons
- Real-time nutrition preview before logging
- Safety warning modal for "avoid" foods
- Recent foods section for quick logging
- Barcode scanner integration

**Data Sources**:
- `/food/search?q={query}` - Food search results
- `/food/log` - POST endpoint for logging food
- `/food/recent` - Recently logged foods

**State Management**:
```typescript
interface FoodLoggingState {
  searchQuery: string;
  searchResults: FoodItem[];
  selectedFood: FoodItem | null;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  mealType: MealType;
  nutritionPreview: NutritionPreview | null;
  recentFoods: FoodItem[];
  loading: boolean;
}
```

#### 3. Enhanced Journal Screen

**Purpose**: Track daily wellness including mood, symptoms, sleep, and energy

**Key Features**:
- Calendar view showing entries with mood indicators
- Entry form with visual scales for mood, sleep, energy
- Symptom multi-select with common pregnancy symptoms
- Cravings text input
- Notes text area
- Entry history with filtering by date range
- Edit/delete functionality with confirmations

**Data Sources**:
- `/journal/entries` - GET list of entries
- `/journal/entries` - POST new entry
- `/journal/entries/{id}` - PUT update entry
- `/journal/entries/{id}` - DELETE entry

**State Management**:
```typescript
interface JournalState {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  formData: JournalEntryCreate;
  dateRange: { start: string; end: string };
  loading: boolean;
  saving: boolean;
}
```

#### 4. Enhanced Profile Screen

**Purpose**: Display and edit user information, pregnancy details, and settings

**Key Features**:
- User information display (name, email)
- Pregnancy information (due date, current week, trimester)
- Edit profile modal
- Notification settings link
- Help & support section
- Logout functionality

**Data Sources**:
- `/users/me` - GET user profile
- `/users/me` - PATCH update profile

### Reusable UI Components

#### 1. PregnancyWeekCard Component

**Purpose**: Display current pregnancy week with visual progress and tips

**Props**:
```typescript
interface PregnancyWeekCardProps {
  week: number;
  trimester: number;
  daysUntilDue: number;
  dueDate: string;
  onWeekChange?: (newWeek: number) => void;
}
```

**Visual Design**:
- Large week number (48px font) in primary color
- Trimester name in bold
- Progress bar showing week/40
- Week-specific tip in a highlighted box
- Soft shadows and rounded corners (16px radius)

#### 2. MacronutrientCard Component

**Purpose**: Display single macronutrient with progress bar

**Props**:
```typescript
interface MacronutrientCardProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon?: string;
}
```

**Visual Design**:
- Nutrient name and icon at top
- Large current value display
- Progress bar with gradient fill
- Target value below bar
- Percentage indicator
- Encouraging message when goal reached

#### 3. MicronutrientChart Component

**Purpose**: Display all micronutrients with expandable details

**Props**:
```typescript
interface MicronutrientChartProps {
  nutrients: MicronutrientData[];
  onNutrientPress: (nutrient: MicronutrientData) => void;
}

interface MicronutrientData {
  name: string;
  current: number;
  target: number;
  unit: string;
  importance: string;
  foodSources: string[];
  percentOfTarget: number;
}
```

**Visual Design**:
- Horizontal bar chart for each nutrient
- Color-coded bars (red <70%, yellow 70-90%, green >90%)
- Tap to expand for detailed information
- Food source suggestions for low nutrients
- Smooth expand/collapse animations

#### 4. FoodSafetyBadge Component

**Purpose**: Display food safety status with color coding

**Props**:
```typescript
interface FoodSafetyBadgeProps {
  status: 'safe' | 'limited' | 'avoid';
  notes?: string;
  onPress?: () => void;
}
```

**Visual Design**:
- Pill-shaped badge with status text
- Green for safe, yellow for limited, red for avoid
- Icon indicator (✓, ⚠, ✗)
- Tappable to show detailed notes modal

#### 5. JournalMoodSelector Component

**Purpose**: Visual mood selection with emoji scale

**Props**:
```typescript
interface JournalMoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
  label: string;
}
```

**Visual Design**:
- 5 emoji buttons (😢 😟 😐 🙂 😊)
- Selected emoji highlighted with border
- Label above selector
- Smooth scale animation on selection

#### 6. WeekTransitionModal Component

**Purpose**: Celebrate new pregnancy week with animation

**Props**:
```typescript
interface WeekTransitionModalProps {
  visible: boolean;
  week: number;
  onDismiss: () => void;
}
```

**Visual Design**:
- Full-screen modal with semi-transparent background
- Animated week number entrance
- Developmental milestone for the week
- Confetti or sparkle animation
- "Continue" button to dismiss

### Custom Hooks

#### 1. useNutritionData Hook

**Purpose**: Fetch and manage nutrition data with caching

```typescript
function useNutritionData(date?: string) {
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    // Fetch from API with error handling
    // Cache results in AsyncStorage
    // Return data
  };

  const refresh = async () => {
    // Force refresh from API
  };

  return { summary, targets, loading, error, refresh };
}
```

#### 2. usePregnancyProgress Hook

**Purpose**: Calculate and track pregnancy progress

```typescript
function usePregnancyProgress(dueDate: string) {
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(null);
  const [previousWeek, setPreviousWeek] = useState<number | null>(null);
  const [weekChanged, setWeekChanged] = useState(false);

  useEffect(() => {
    // Calculate current week and trimester
    // Check if week changed since last visit
    // Trigger week transition animation if needed
  }, [dueDate]);

  return { pregnancyInfo, weekChanged, dismissWeekChange };
}
```

#### 3. useOfflineSync Hook

**Purpose**: Manage offline data storage and synchronization

```typescript
function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  const queueAction = async (action: PendingAction) => {
    // Store action in AsyncStorage
  };

  const syncPendingActions = async () => {
    // Send all pending actions to API
    // Clear from storage on success
  };

  useEffect(() => {
    // Listen for connectivity changes
    // Auto-sync when connection restored
  }, []);

  return { isOnline, queueAction, syncPendingActions, pendingActions };
}
```

#### 4. useMicronutrientCalculator Hook

**Purpose**: Calculate micronutrient totals from food logs

```typescript
function useMicronutrientCalculator(foodLogs: FoodLog[]) {
  const [micronutrients, setMicronutrients] = useState<MicronutrientData[]>([]);

  useEffect(() => {
    // Extract micronutrients from each food log
    // Sum up totals for each nutrient
    // Calculate percentage of targets
    // Format for display
  }, [foodLogs]);

  return micronutrients;
}
```

## Data Models

### Frontend Type Definitions

```typescript
// Enhanced User Type
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dueDate: string; // ISO date string
  trimester: number;
  babies: number;
  prePregnancyWeight?: number;
  height?: number;
  currentWeight?: number;
  allergies: string[];
  conditions: string[];
}

// Pregnancy Information
interface PregnancyInfo {
  week: number;
  trimester: number;
  daysUntilDue: number;
  daysPassed: number;
  conceptionDate: string;
  weekTip: string;
  trimesterName: string;
}

// Nutrition Targets (from backend)
interface NutritionTargets {
  calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  micronutrients: {
    fiber_g: number;
    calcium_mg: number;
    iron_mg: number;
    folate_mcg: number;
    vitamin_d_mcg: number;
    vitamin_c_mg: number;
    vitamin_a_mcg: number;
    vitamin_b12_mcg: number;
    magnesium_mg: number;
    dha_mg: number;
    choline_mg: number;
  };
  water_ml: number;
}

// Nutrition Summary (from backend)
interface NutritionSummary {
  date: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
  folate_mcg: number;
  vitamin_b12_mcg: number;
  magnesium_mg: number;
}

// Food Item (from backend)
interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  micronutrients: Record<string, MicronutrientValue>;
  ingredients?: string[];
  allergens?: string[];
  safety_status: 'safe' | 'limited' | 'avoid';
  safety_notes?: string;
  source: 'spoonacular' | 'usda' | 'manual';
}

interface MicronutrientValue {
  amount: number;
  unit: string;
  percent_daily_value?: number;
}

// Food Log Entry (from backend)
interface FoodLog {
  id: string;
  user_id: string;
  food_id: string;
  serving_size: number;
  serving_unit: string;
  quantity: number;
  consumed_at: string; // ISO datetime
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  calories_logged: number;
  nutrients_logged: Record<string, number>;
  food: FoodItem; // Populated by backend
}

// Journal Entry (from backend)
interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string; // ISO date
  symptoms: string[];
  mood: number; // 1-5
  cravings?: string;
  sleep_quality: number; // 1-5
  energy_level: number; // 1-5
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Error Handling Strategy

1. **Network Errors**: Display friendly message "Unable to connect. Please check your internet connection." with retry button
2. **API Errors**: Parse error response and display specific message from backend
3. **Validation Errors**: Show inline validation messages near form fields
4. **Offline Mode**: Automatically queue actions and show offline indicator
5. **Loading States**: Show skeleton screens or loading indicators for all async operations

### Error Display Components

```typescript
// Toast Notification Component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss: () => void;
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  // Catch React errors and display fallback UI
  // Log errors to error tracking service
}
```

## Testing Strategy

### Unit Testing

- Test custom hooks with React Testing Library
- Test utility functions (pregnancy calculations, nutrient calculations)
- Test data transformation functions
- Mock API responses for consistent testing

### Component Testing

- Test component rendering with various props
- Test user interactions (button presses, form submissions)
- Test conditional rendering based on state
- Test accessibility features (labels, hints, roles)

### Integration Testing

- Test complete user flows (login → dashboard → log food)
- Test offline functionality and sync
- Test navigation between screens
- Test data persistence and retrieval

### E2E Testing (Optional)

- Test critical user journeys with Detox
- Test on both iOS and Android platforms
- Test with real backend API in staging environment

## Performance Optimization

### Optimization Strategies

1. **Memoization**: Use `React.memo` for expensive components, `useMemo` for calculations, `useCallback` for functions
2. **Lazy Loading**: Load screens and heavy components only when needed
3. **Image Optimization**: Use optimized image formats, implement lazy loading for images
4. **List Virtualization**: Use `FlatList` with `windowSize` optimization for long lists
5. **API Response Caching**: Cache frequently accessed data (user profile, nutrition targets) with 5-minute TTL
6. **Debouncing**: Debounce search inputs (300ms) to reduce API calls
7. **Bundle Size**: Code-split large dependencies, remove unused imports

### Performance Monitoring

- Monitor app startup time (target: <2 seconds)
- Monitor screen transition time (target: <500ms)
- Monitor API response times
- Monitor memory usage and detect leaks
- Use React DevTools Profiler to identify slow renders

## Visual Design System

### Color Palette

```typescript
const colors = {
  // Primary Colors (Soft and Warm)
  primary: '#E8B4B8', // Soft rose pink
  primaryDark: '#D89BA0',
  primaryLight: '#F5D5D8',
  
  // Secondary Colors
  secondary: '#B8D4E8', // Soft sky blue
  secondaryDark: '#9ABFD6',
  secondaryLight: '#D5E8F5',
  
  // Accent Colors
  accent: '#F4D9A6', // Warm cream
  accentDark: '#E8C78A',
  accentLight: '#F9ECD4',
  
  // Semantic Colors
  success: '#A8D5BA', // Soft green
  warning: '#F4C790', // Soft orange
  error: '#E8A4A4', // Soft red
  info: '#A4C4E8', // Soft blue
  
  // Neutral Colors
  background: '#FAF9F7', // Warm off-white
  surface: '#FFFFFF',
  border: '#E8E6E3',
  
  // Text Colors
  text: {
    primary: '#4A4A4A',
    secondary: '#7A7A7A',
    muted: '#A8A8A8',
    inverse: '#FFFFFF',
  },
  
  // Safety Status Colors
  safe: '#A8D5BA',
  limited: '#F4C790',
  avoid: '#E8A4A4',
};
```

### Typography

```typescript
const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing System

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Border Radius

```typescript
const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};
```

### Shadows

```typescript
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};
```

### Animation Timings

```typescript
const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 400,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};
```

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

1. **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
2. **Touch Targets**: Minimum 44x44 pixels for all interactive elements
3. **Screen Reader Support**: Provide meaningful labels and hints for all elements
4. **Keyboard Navigation**: Support for external keyboard navigation
5. **Focus Indicators**: Clear visual focus indicators for all interactive elements
6. **Alternative Text**: Provide alt text for all images and icons
7. **Dynamic Text**: Support iOS Dynamic Type and Android font scaling

### Accessibility Implementation

```typescript
// Example accessible button
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Log breakfast meal"
  accessibilityHint="Opens food logging screen for breakfast"
  accessibilityState={{ disabled: false }}
  style={styles.button}
  onPress={handlePress}
>
  <Text>Log Breakfast</Text>
</TouchableOpacity>

// Example accessible form input
<TextInput
  accessible={true}
  accessibilityLabel="Food search"
  accessibilityHint="Enter food name to search"
  placeholder="Search for food..."
  value={searchQuery}
  onChangeText={setSearchQuery}
/>
```

## Security Considerations

### Data Security

1. **Token Storage**: Use SecureStore (iOS Keychain/Android Keystore) for auth tokens
2. **Sensitive Data**: Never log sensitive user data (passwords, tokens)
3. **HTTPS Only**: All API calls use HTTPS
4. **Input Validation**: Validate all user inputs before sending to API
5. **XSS Prevention**: Sanitize any user-generated content before display

### Privacy

1. **Data Minimization**: Only request necessary permissions
2. **Local Storage**: Encrypt sensitive data in AsyncStorage
3. **Session Management**: Implement automatic logout after inactivity
4. **Data Deletion**: Provide clear data deletion options

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up enhanced theme system with new color palette
- Create base reusable components (cards, buttons, inputs)
- Implement custom hooks (useNutritionData, usePregnancyProgress)
- Set up error handling and loading states

### Phase 2: Dashboard Enhancement (Week 2)
- Redesign Dashboard screen with new layout
- Implement PregnancyWeekCard component
- Create MacronutrientCard components
- Build MicronutrientChart component
- Integrate real API data (no mocks)

### Phase 3: Food Logging Enhancement (Week 3)
- Redesign FoodLoggingScreen with improved UX
- Implement serving size selector
- Add nutrition preview before logging
- Enhance safety status display
- Improve barcode scanner integration

### Phase 4: Journal Enhancement (Week 4)
- Redesign JournalScreen with calendar view
- Create visual mood/sleep/energy selectors
- Implement symptom multi-select
- Add entry history with filtering
- Build edit/delete functionality

### Phase 5: Polish and Optimization (Week 5)
- Implement offline sync functionality
- Add animations and transitions
- Optimize performance (memoization, caching)
- Conduct accessibility audit
- Fix bugs and edge cases

### Phase 6: Testing and Refinement (Week 6)
- Write unit tests for hooks and utilities
- Write component tests
- Conduct user testing
- Refine based on feedback
- Prepare for release
