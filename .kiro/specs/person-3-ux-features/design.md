# Design Document

## Overview

This design document outlines the technical architecture and implementation approach for Person 3's User Experience and Engagement features in the Ovi Pregnancy Nutrition App. The features include barcode scanning, journal and mood tracking, push notifications, and enhanced UI/UX components. All features will be implemented in the React Native/Expo frontend with supporting backend API endpoints.

## Architecture

### High-Level Component Structure

```
ovi-frontend/
├── app/
│   ├── screens/
│   │   ├── BarcodeScannerScreen.tsx (NEW)
│   │   ├── JournalScreen.tsx (NEW)
│   │   ├── JournalEntryScreen.tsx (NEW)
│   │   ├── NotificationSettingsScreen.tsx (NEW)
│   │   └── DashboardScreen.tsx (ENHANCED)
│   ├── components/
│   │   ├── NutrientChart.tsx (NEW)
│   │   ├── PregnancyWeekDisplay.tsx (NEW)
│   │   ├── MoodSelector.tsx (NEW)
│   │   ├── SymptomPicker.tsx (NEW)
│   │   └── ProgressBar.tsx (EXISTING)
│   ├── services/
│   │   ├── api.ts (ENHANCED)
│   │   ├── notificationService.ts (NEW)
│   │   └── barcodeService.ts (NEW)
│   ├── hooks/
│   │   ├── useNotifications.ts (NEW)
│   │   └── usePregnancyWeek.ts (NEW)
│   └── types/
│       └── index.ts (ENHANCED)
```

```
backend/
├── app/
│   ├── api/
│   │   └── journal.py (NEW)
│   ├── models/
│   │   └── journal.py (NEW)
│   └── schemas/
│       └── journal.py (NEW)
```

## Components and Interfaces

### 1. Barcode Scanning

#### Frontend Components

**BarcodeScannerScreen.tsx**
- Uses `expo-barcode-scanner` for camera access and barcode detection
- Displays camera view with scanning overlay
- Shows loading state while querying food database
- Displays product information for confirmation
- Handles "not found" scenarios with manual entry option

**barcodeService.ts**
- Queries OpenFoodFacts API: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- Falls back to USDA API if OpenFoodFacts returns no data
- Transforms external API responses to internal FoodItem format
- Caches barcode lookups to reduce API calls

#### Data Flow
```
User scans barcode
  → expo-barcode-scanner detects code
  → barcodeService queries OpenFoodFacts API
  → Transform response to FoodItem
  → Display product info for confirmation
  → User confirms → Create food log entry via foodAPI.logFood()
```

#### External API Integration

**OpenFoodFacts API**
```typescript
interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name: string;
    brands: string;
    nutriments: {
      energy_100g: number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
      fiber_100g: number;
      sugars_100g: number;
      sodium_100g: number;
    };
    serving_size?: string;
  };
}
```

### 2. Journal and Mood Tracking

#### Backend Models

**models/journal.py**
```python
class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    symptoms = Column(ARRAY(String), default=[])  # ['nausea', 'fatigue', 'headache']
    mood = Column(Integer)  # 1-5 scale
    cravings = Column(Text)
    sleep_quality = Column(Integer)  # 1-5 scale
    energy_level = Column(Integer)  # 1-5 scale
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="journal_entries")
```

#### Backend API Endpoints

**POST /journal/entries**
- Create new journal entry
- Request body: JournalEntryCreate schema
- Returns: Created journal entry with ID

**GET /journal/entries**
- Retrieve user's journal entries
- Query params: start_date, end_date (optional)
- Returns: List of journal entries (newest first)

**GET /journal/entries/{entry_id}**
- Retrieve specific journal entry
- Returns: Journal entry details

**PUT /journal/entries/{entry_id}**
- Update existing journal entry
- Request body: JournalEntryUpdate schema
- Returns: Updated journal entry

**DELETE /journal/entries/{entry_id}**
- Delete journal entry
- Returns: 204 No Content

#### Frontend Components

**JournalScreen.tsx**
- Displays list of past journal entries
- Shows date, mood emoji, and snippet of notes
- Pull-to-refresh functionality
- Floating action button to create new entry
- Filters by date range

**JournalEntryScreen.tsx**
- Form for creating/editing journal entries
- Date picker (defaults to today)
- Symptom multi-select with common options
- Mood selector with emoji scale (1-5)
- Cravings text input
- Sleep quality slider (1-5)
- Energy level slider (1-5)
- Notes text area
- Save and cancel buttons

**MoodSelector.tsx**
- Reusable component for mood selection
- Displays 5 emoji options: 😢 😟 😐 🙂 😊
- Highlights selected mood
- Returns numeric value (1-5)

**SymptomPicker.tsx**
- Multi-select component for symptoms
- Predefined options: Nausea, Fatigue, Headache, Back Pain, Swelling, Heartburn, Constipation, Insomnia
- Allows custom symptom entry
- Returns array of selected symptoms

#### TypeScript Interfaces

```typescript
interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;  // ISO date string
  symptoms: string[];
  mood: number;  // 1-5
  cravings: string;
  sleep_quality: number;  // 1-5
  energy_level: number;  // 1-5
  notes: string;
  created_at: string;
  updated_at: string;
}

interface JournalEntryCreate {
  entry_date: string;
  symptoms?: string[];
  mood?: number;
  cravings?: string;
  sleep_quality?: number;
  energy_level?: number;
  notes?: string;
}
```

### 3. Push Notifications

#### Notification Service

**notificationService.ts**
- Uses `expo-notifications` for push notification handling
- Manages notification permissions
- Schedules local notifications
- Handles notification taps and routing

**Key Functions:**
```typescript
- requestPermissions(): Promise<boolean>
- scheduleHydrationReminder(intervalHours: number): Promise<string>
- scheduleSupplementReminder(time: Date, supplementName: string): Promise<string>
- scheduleMealReminder(time: Date, mealType: string): Promise<string>
- cancelNotification(notificationId: string): Promise<void>
- cancelAllNotifications(): Promise<void>
- getScheduledNotifications(): Promise<Notification[]>
```

#### Notification Types

**Hydration Reminder**
- Title: "💧 Time to Hydrate"
- Body: "Remember to drink water! Stay hydrated for you and baby."
- Repeats: Every 2 hours (configurable)
- Action: Opens water tracking screen

**Supplement Reminder**
- Title: "💊 Supplement Reminder"
- Body: "Time to take your [supplement name]"
- Repeats: Daily at configured time
- Action: Opens supplement log screen

**Meal Logging Reminder**
- Title: "🍽️ Log Your Meal"
- Body: "Don't forget to log your [meal type]"
- Repeats: Daily at configured times
- Action: Opens food logging screen

#### Notification Settings Screen

**NotificationSettingsScreen.tsx**
- Toggle switches for each notification type
- Time pickers for scheduled notifications
- Hydration interval selector (1-4 hours)
- Supplement name input
- Meal time customization
- Test notification button
- Save preferences to AsyncStorage and backend

#### Data Storage

**AsyncStorage Keys:**
```typescript
{
  notifications_enabled: boolean;
  hydration_reminders: boolean;
  hydration_interval: number;  // hours
  supplement_reminders: boolean;
  supplement_time: string;  // HH:mm format
  supplement_name: string;
  meal_reminders: boolean;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
}
```

### 4. Enhanced UI/UX Components

#### PregnancyWeekDisplay Component

**PregnancyWeekDisplay.tsx**
- Calculates current week from due date
- Displays week number and trimester
- Shows visual progress indicator
- Displays week-specific tip or milestone
- Animated transition when week changes

**Calculation Logic:**
```typescript
function calculatePregnancyWeek(dueDate: Date): {
  week: number;
  trimester: number;
  daysUntilDue: number;
} {
  const today = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = 280; // 40 weeks
  const daysPassed = totalDays - daysUntilDue;
  const week = Math.floor(daysPassed / 7) + 1;
  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  
  return { week, trimester, daysUntilDue };
}
```

#### NutrientChart Component

**NutrientChart.tsx**
- Displays visual chart for micronutrients
- Uses react-native-svg for custom charts
- Color-coded status indicators:
  - Green: ≥90% of daily goal
  - Yellow: 60-89% of daily goal
  - Red: <60% of daily goal
- Tap to view detailed nutrient information
- Animated progress fills

**Micronutrients Tracked:**
- Folate (600 mcg DFE)
- Iron (27 mg)
- Calcium (1000 mg)
- DHA (200-300 mg)
- Choline (450 mg)
- Vitamin D (600 IU)
- Vitamin B12 (2.6 mcg)
- Magnesium (350-360 mg)

#### Enhanced Dashboard

**DashboardScreen.tsx Updates**
- Add PregnancyWeekDisplay at top
- Replace simple progress bars with NutrientChart
- Add quick action buttons for journal and barcode scanner
- Display today's journal entry summary if exists
- Show notification status and quick settings access

#### Weekly Transition Animation

**WeekTransitionAnimation.tsx**
- Uses Lottie for smooth animations
- Triggers when pregnancy week increments
- Displays congratulatory message
- Shows new week milestone
- Auto-dismisses after 3 seconds

## Data Models

### Frontend TypeScript Types

```typescript
// Add to types/index.ts

export interface PregnancyInfo {
  currentWeek: number;
  trimester: number;
  dueDate: string;
  daysUntilDue: number;
}

export interface MicronutrientTarget {
  name: string;
  current: number;
  target: number;
  unit: string;
  importance: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  hydration: {
    enabled: boolean;
    intervalHours: number;
  };
  supplements: {
    enabled: boolean;
    time: string;
    name: string;
  };
  meals: {
    enabled: boolean;
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}
```

### Backend Database Schema

```sql
-- Journal Entries Table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    symptoms TEXT[],
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    cravings TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, entry_date DESC);

-- Notification Preferences Table (optional, can use user preferences JSON field)
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    hydration_enabled BOOLEAN DEFAULT true,
    hydration_interval INTEGER DEFAULT 2,
    supplement_enabled BOOLEAN DEFAULT true,
    supplement_time TIME DEFAULT '08:00:00',
    supplement_name VARCHAR(100) DEFAULT 'Prenatal Vitamin',
    meal_reminders_enabled BOOLEAN DEFAULT true,
    breakfast_time TIME DEFAULT '08:00:00',
    lunch_time TIME DEFAULT '12:00:00',
    dinner_time TIME DEFAULT '18:00:00',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Barcode Scanner
- **Camera Permission Denied**: Show alert with instructions to enable in settings
- **Barcode Not Found**: Display "Product not found" message with manual entry option
- **API Timeout**: Show retry button and cache last successful scan
- **Invalid Barcode Format**: Display error message and allow rescan

### Journal Entries
- **Network Error**: Save entry locally and sync when connection restored
- **Validation Error**: Display inline error messages for invalid fields
- **Duplicate Entry**: Prompt user to edit existing entry for that date

### Push Notifications
- **Permission Denied**: Show explanation and link to settings
- **Scheduling Failed**: Log error and notify user
- **Notification Not Delivered**: Store in notification history for manual review

### UI Components
- **Data Loading Error**: Display error state with retry button
- **Missing Due Date**: Prompt user to complete profile
- **Calculation Error**: Use fallback values and log error

## Testing Strategy

### Unit Tests
- `calculatePregnancyWeek()` function with various due dates
- `barcodeService` API response transformation
- Notification scheduling logic
- Form validation for journal entries

### Integration Tests
- Barcode scan → API call → Food log creation flow
- Journal entry creation → Backend save → Retrieval flow
- Notification scheduling → Delivery → Tap handling flow
- Dashboard data loading and display

### Component Tests
- MoodSelector user interaction and value selection
- SymptomPicker multi-select functionality
- NutrientChart rendering with various data states
- PregnancyWeekDisplay calculation and display

### E2E Tests
- Complete barcode scanning workflow
- Create, edit, and delete journal entry
- Configure notification settings and receive notification
- Navigate through enhanced dashboard

### Manual Testing Checklist
- [ ] Test barcode scanner with various product types
- [ ] Verify notification delivery at scheduled times
- [ ] Test journal entry on different dates
- [ ] Verify pregnancy week calculation accuracy
- [ ] Test accessibility with screen reader
- [ ] Verify color contrast ratios
- [ ] Test on iOS and Android devices
- [ ] Test with different screen sizes

## Dependencies

### New NPM Packages
```json
{
  "expo-barcode-scanner": "^13.0.1",
  "expo-notifications": "^0.28.0",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "react-native-svg": "^15.0.0",
  "lottie-react-native": "^7.0.0"
}
```

### Backend Python Packages
```
# Already included in requirements.txt
sqlalchemy
fastapi
pydantic
```

## Performance Considerations

- **Barcode Scanner**: Debounce scan detection to prevent multiple API calls
- **Journal List**: Implement pagination for users with many entries
- **Notifications**: Batch schedule notifications to reduce processing
- **Charts**: Use memoization to prevent unnecessary re-renders
- **Images**: Lazy load journal entry images if added in future

## Accessibility

- All interactive elements have minimum 44x44pt touch targets
- Color is not the only indicator of status (use icons + text)
- All images have alt text
- Form inputs have proper labels
- Screen reader support for all components
- High contrast mode support
- Font scaling support

## Security Considerations

- Notification content does not expose sensitive health data in preview
- Journal entries are user-scoped and validated on backend
- Camera permissions requested with clear explanation
- No PII stored in notification payloads
- API tokens secured in SecureStore
- Input sanitization for journal text fields
