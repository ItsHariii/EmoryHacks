# Design Document

## Overview

This design addresses critical stability issues in the Aurea mobile application by:
1. Migrating from deprecated React Native SafeAreaView to react-native-safe-area-context
2. Fixing API endpoint mismatches causing 404 errors
3. Implementing robust error handling and user feedback mechanisms
4. Ensuring graceful degradation for unavailable features

The solution focuses on minimal code changes while maximizing stability improvements and maintaining backward compatibility.

## Architecture

### Component Architecture

```
┌─────────────────────────────────────────┐
│         DashboardScreen                 │
│  (Updated with SafeAreaProvider)        │
└────────────┬────────────────────────────┘
             │
             ├──► SafeAreaView (from context)
             ├──► API Service Layer
             │    └──► Corrected Endpoints
             └──► Error Boundary Component
                  └──► User-Friendly Error States
```

### API Layer Architecture

```
Frontend (api.ts)          Backend (FastAPI)
─────────────────          ─────────────────
nutritionAPI               /food/nutrition-summary
  └─ getDailySummary()  ──►  (GET)
                             Returns: DailyNutrition
```

## Components and Interfaces

### 1. SafeAreaView Migration

**Current Implementation:**
```typescript
import { SafeAreaView } from 'react-native';

<SafeAreaView style={styles.container}>
  {/* content */}
</SafeAreaView>
```

**New Implementation:**
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
  {/* content */}
</SafeAreaView>
```

**Changes Required:**
- Update import statement in DashboardScreen.tsx
- Verify react-native-safe-area-context is installed (already in package.json v5.6.1)
- Ensure SafeAreaProvider wraps the app in App.tsx
- Add optional `edges` prop for fine-grained control

### 2. API Endpoint Correction

**Interface: NutritionAPI**

```typescript
interface NutritionAPI {
  getDailySummary(date?: string): Promise<NutritionSummary>;
  getWeeklySummary(startDate: string): Promise<NutritionSummary[]>;
}
```

**Current Endpoint (Incorrect):**
- Frontend calls: `GET /nutrition/daily-summary`
- Backend provides: `GET /food/nutrition-summary`

**Fix:**
- Update `api.ts` to call `/food/nutrition-summary` instead of `/nutrition/daily-summary`
- Maintain the same interface for calling code

**Backend Endpoint Contract:**
```
GET /food/nutrition-summary?date=YYYY-MM-DD
Response: {
  date: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number
}
```

**Interface: FoodAPI**

```typescript
interface FoodAPI {
  search(query: string, page?: number, limit?: number): Promise<SearchResult>;
}
```

**Current Parameter Mismatch:**
- Frontend sends: `GET /food/search?q=apple&page=2&limit=20`
- Backend expects: `GET /food/search?query=apple&page=2&limit=20`
- Error: 422 Unprocessable Entity - Field 'query' required

**Fix:**
- Update `api.ts` foodAPI.search to use `query` parameter instead of `q`
- Change from `params: { q: query, page, limit }` to `params: { query, page, limit }`

**Backend Endpoint Contract:**
```
GET /food/search?query=<search_term>
Response: [
  {
    id: string,
    name: string,
    brand: string,
    calories: number,
    ...
  }
]
```

### 3. Error Handling Enhancement

**Error State Component Interface:**

```typescript
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
}
```

**Implementation Strategy:**
- Wrap API calls in try-catch blocks
- Distinguish between error types (404, 500, network errors)
- Provide user-friendly messages
- Offer retry functionality for transient errors
- Log detailed errors for debugging

**Error Handling Flow:**
```
API Call
  ├─► Success → Update State
  ├─► 404 → Show "Data not available" + Retry
  ├─► 500 → Show "Service unavailable" + Retry
  ├─► Network Error → Show "Connection issue" + Retry
  └─► Unknown → Show generic error + Retry
```

### 4. Graceful Feature Degradation

**Notification Service Enhancement:**

```typescript
// Current: Logs to console
console.log('Notifications not available in Expo Go');

// Enhanced: Silent handling with fallback
if (!isNotificationAvailable()) {
  // Silently disable notification features
  // Don't show user-facing errors
  // Log for developer awareness only
}
```

## Data Models

### NutritionSummary (Existing)
```typescript
interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
```

### ErrorState (New)
```typescript
interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'server' | 'notfound' | 'unknown';
  retryable: boolean;
}
```

## Error Handling

### Error Categories

1. **Network Errors**
   - User message: "Unable to connect. Please check your internet connection."
   - Action: Retry button
   - Logging: Full error stack

2. **404 Not Found**
   - User message: "No nutrition data available for today yet. Start logging food!"
   - Action: Navigate to food logging
   - Logging: Endpoint and request details

3. **500 Server Errors**
   - User message: "Service temporarily unavailable. Please try again."
   - Action: Retry button
   - Logging: Full error response

4. **Deprecation Warnings**
   - User message: None (developer-only)
   - Action: Fix in code
   - Logging: Console warning in development only

### Error Handling Implementation

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const summary = await nutritionAPI.getDailySummary();
    setNutritionSummary(summary);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        setError({
          hasError: true,
          message: 'No nutrition data available yet',
          type: 'notfound',
          retryable: false
        });
      } else if (error.response?.status >= 500) {
        setError({
          hasError: true,
          message: 'Service temporarily unavailable',
          type: 'server',
          retryable: true
        });
      } else if (error.code === 'ECONNABORTED' || !error.response) {
        setError({
          hasError: true,
          message: 'Connection issue',
          type: 'network',
          retryable: true
        });
      }
    }
    // Fallback to mock data for demo
    setNutritionSummary(mockData);
  } finally {
    setLoading(false);
  }
};
```

## Testing Strategy

### Unit Tests
- Test API endpoint URL construction
- Test error handling logic for different error types
- Test SafeAreaView rendering with different edge configurations

### Integration Tests
- Test DashboardScreen with mocked API responses
- Test error state rendering and retry functionality
- Test SafeAreaView integration with navigation

### Manual Testing
- Verify no deprecation warnings in console
- Test with backend offline (network errors)
- Test with invalid endpoints (404 errors)
- Test on iOS and Android devices
- Verify safe area insets on devices with notches

### Regression Testing
- Ensure existing functionality remains unchanged
- Verify layout consistency after SafeAreaView migration
- Test all navigation flows
- Verify data loading and refresh functionality

## Implementation Notes

### SafeAreaView Migration
- The package `react-native-safe-area-context` is already installed (v5.6.1)
- Need to verify SafeAreaProvider is wrapping the app
- The migration is a simple import change with optional edge configuration
- No visual changes expected if implemented correctly

### API Endpoint Fix
- Single line change in `api.ts`
- No backend changes required
- Maintains existing interface contract
- Should immediately resolve 404 errors

### Error Handling
- Implement incrementally without breaking existing functionality
- Start with basic error states, enhance with retry logic
- Consider adding error boundary component for future robustness
- Log errors appropriately for debugging

### Performance Considerations
- SafeAreaView migration has no performance impact
- Error handling adds minimal overhead
- Consider debouncing retry attempts to prevent API spam
- Cache successful responses to reduce API calls

## Dependencies

### Existing Dependencies (No Changes)
- react-native-safe-area-context: ^5.6.1 ✓ Already installed
- axios: ^1.11.0 ✓ Already installed
- @react-navigation/native: ^7.1.17 ✓ Already installed

### No New Dependencies Required
All fixes can be implemented with existing dependencies.

## Migration Path

1. **Phase 1: SafeAreaView Migration**
   - Update DashboardScreen import
   - Verify SafeAreaProvider in App.tsx
   - Test on multiple devices

2. **Phase 2: API Endpoint Fix**
   - Update nutritionAPI.getDailySummary endpoint
   - Test with backend running
   - Verify data loads correctly

3. **Phase 3: Error Handling Enhancement**
   - Add error state management
   - Implement user-friendly error messages
   - Add retry functionality
   - Test error scenarios

4. **Phase 4: Validation**
   - Run full test suite
   - Manual testing on iOS and Android
   - Verify no console warnings
   - Confirm all features working

## Rollback Plan

If issues arise:
1. SafeAreaView: Revert import to React Native version
2. API Endpoint: Revert to original endpoint (will still 404 but no worse)
3. Error Handling: Remove error states, keep existing try-catch
4. All changes are isolated and can be reverted independently
