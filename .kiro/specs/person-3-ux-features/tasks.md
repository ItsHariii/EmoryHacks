# Implementation Plan

- [x] 1. Set up project dependencies and configuration
  - Install required npm packages: expo-barcode-scanner, expo-notifications, lottie-react-native, react-native-svg
  - Configure app.json for camera and notification permissions
  - Update TypeScript types in types/index.ts with new interfaces
  - _Requirements: All requirements (foundation)_

- [x] 2. Implement barcode scanning functionality
  - [x] 2.1 Create barcodeService.ts for external API integration
    - Implement OpenFoodFacts API client with barcode lookup
    - Add response transformation to FoodItem format
    - Implement error handling and fallback logic
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x] 2.2 Build BarcodeScannerScreen component
    - Implement camera view with expo-barcode-scanner
    - Add scanning overlay UI with maroon theme
    - Create product confirmation modal
    - Handle barcode detection and API calls
    - Add "not found" state with manual entry option
    - Implement navigation back to food logging
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 2.3 Integrate barcode scanner into navigation
    - Add BarcodeScannerScreen to navigation stack
    - Create navigation link from FoodLoggingScreen
    - Add quick action button on Dashboard
    - _Requirements: 1.7_

- [x] 3. Build journal and mood tracking backend
  - [x] 3.1 Create backend database models
    - Create models/journal.py with JournalEntry model
    - Define relationships with User model
    - Create database migration with Alembic
    - _Requirements: 5.6_
  
  - [x] 3.2 Implement journal API schemas
    - Create schemas/journal.py with Pydantic models
    - Define JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
    - Add validation for mood, sleep_quality, energy_level ranges
    - _Requirements: 5.1_
  
  - [x] 3.3 Build journal API endpoints
    - Create api/journal.py router
    - Implement POST /journal/entries endpoint
    - Implement GET /journal/entries with date filtering
    - Implement GET /journal/entries/{entry_id} endpoint
    - Implement PUT /journal/entries/{entry_id} endpoint
    - Implement DELETE /journal/entries/{entry_id} endpoint
    - Add user authentication and authorization checks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  
  - [x] 3.4 Register journal router in main.py
    - Import and include journal router
    - Add journal tag to API documentation
    - _Requirements: 5.1_

- [x] 4. Implement journal tracking frontend
  - [x] 4.1 Create reusable journal components
    - Build MoodSelector.tsx with emoji scale (1-5)
    - Build SymptomPicker.tsx with multi-select functionality
    - Add predefined symptom options and custom entry
    - Style components with maroon theme
    - _Requirements: 2.6, 2.7_
  
  - [x] 4.2 Build JournalEntryScreen for creating/editing entries
    - Create form with date picker (default today)
    - Integrate MoodSelector component
    - Integrate SymptomPicker component
    - Add cravings text input
    - Add sleep quality slider (1-5)
    - Add energy level slider (1-5)
    - Add notes text area
    - Implement save functionality with API call
    - Add form validation
    - Handle edit mode vs create mode
    - _Requirements: 2.1, 2.2, 2.7, 2.8, 2.9, 2.10_
  
  - [x] 4.3 Build JournalScreen for viewing entries
    - Create list view of past journal entries
    - Display date, mood emoji, and notes snippet
    - Implement pull-to-refresh functionality
    - Add floating action button for new entry
    - Implement date range filtering
    - Handle empty state
    - Add navigation to JournalEntryScreen for editing
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [x] 4.4 Add journal API functions to services/api.ts
    - Implement createJournalEntry function
    - Implement getJournalEntries function with date filtering
    - Implement updateJournalEntry function
    - Implement deleteJournalEntry function
    - Add error handling and TypeScript types
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [x] 4.5 Integrate journal into app navigation
    - Add JournalScreen to tab navigator or drawer
    - Add quick action on Dashboard to create journal entry
    - Display today's journal summary on Dashboard if exists
    - _Requirements: 2.1_

- [x] 5. Implement push notifications system
  - [x] 5.1 Create notification service
    - Build notificationService.ts with expo-notifications
    - Implement requestPermissions function
    - Implement scheduleHydrationReminder function
    - Implement scheduleSupplementReminder function
    - Implement scheduleMealReminder function
    - Implement cancelNotification and cancelAllNotifications
    - Add notification tap handler with navigation
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 5.2 Create useNotifications custom hook
    - Implement hook for managing notification state
    - Load preferences from AsyncStorage
    - Provide functions to schedule/cancel notifications
    - Handle notification permissions
    - _Requirements: 3.2, 3.8_
  
  - [x] 5.3 Build NotificationSettingsScreen
    - Create toggle switches for each notification type
    - Add time pickers for scheduled notifications
    - Add hydration interval selector (1-4 hours)
    - Add supplement name input field
    - Add meal time customization inputs
    - Implement save functionality to AsyncStorage
    - Add test notification button
    - Style with maroon theme
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.8_
  
  - [x] 5.4 Integrate notifications into app
    - Request permissions during onboarding or first use
    - Add NotificationSettingsScreen to navigation
    - Display notification status on Dashboard
    - Implement notification history view
    - Handle notification taps and deep linking
    - _Requirements: 3.1, 3.7, 3.9, 3.10_

- [x] 6. Build enhanced UI/UX components
  - [x] 6.1 Create PregnancyWeekDisplay component
    - Implement calculatePregnancyWeek utility function
    - Build component to display current week and trimester
    - Add visual progress indicator
    - Display week-specific tip or milestone
    - Style with maroon theme
    - _Requirements: 4.1, 4.2_
  
  - [x] 6.2 Create usePregnancyWeek custom hook
    - Implement hook to calculate and manage pregnancy week
    - Load due date from user profile
    - Provide week, trimester, and days until due
    - Handle missing due date scenario
    - _Requirements: 4.2_
  
  - [x] 6.3 Build NutrientChart component
    - Create visual chart for micronutrients using react-native-svg
    - Implement color-coded status indicators (green/yellow/red)
    - Add tap handler to show detailed nutrient info
    - Implement animated progress fills
    - Display 8 key pregnancy micronutrients
    - Style with maroon theme
    - _Requirements: 4.4, 4.5, 4.6_
  
  - [x] 6.4 Create WeekTransitionAnimation component
    - Integrate Lottie animation for week changes
    - Display congratulatory message
    - Show new week milestone
    - Implement auto-dismiss after 3 seconds
    - _Requirements: 4.7_
  
  - [x] 6.5 Enhance DashboardScreen
    - Add PregnancyWeekDisplay at top of dashboard
    - Replace simple progress bars with NutrientChart
    - Add quick action buttons for journal and barcode scanner
    - Display today's journal entry summary if exists
    - Show notification status indicator
    - Ensure all elements use maroon theme
    - _Requirements: 4.1, 4.3, 4.4, 4.8, 4.9_
  
  - [x] 6.6 Implement accessibility improvements
    - Ensure all interactive elements have 44x44pt minimum touch targets
    - Add proper labels to all form inputs
    - Implement screen reader support for all components
    - Verify color contrast ratios meet WCAG AA standards
    - Add alt text for icons and images
    - Test with device accessibility features enabled
    - _Requirements: 4.10_

- [ ]* 7. Testing and quality assurance
  - [ ]* 7.1 Write unit tests
    - Test calculatePregnancyWeek with various due dates
    - Test barcodeService API response transformation
    - Test notification scheduling logic
    - Test journal entry form validation
    - _Requirements: All_
  
  - [ ]* 7.2 Write component tests
    - Test MoodSelector interaction and value selection
    - Test SymptomPicker multi-select functionality
    - Test NutrientChart rendering with various data
    - Test PregnancyWeekDisplay calculation and display
    - _Requirements: All_
  
  - [ ]* 7.3 Perform integration testing
    - Test barcode scan to food log creation flow
    - Test journal entry creation to retrieval flow
    - Test notification scheduling to delivery flow
    - Test dashboard data loading and display
    - _Requirements: All_
  
  - [ ]* 7.4 Manual testing on devices
    - Test barcode scanner with various products
    - Verify notification delivery at scheduled times
    - Test journal entry on different dates
    - Verify pregnancy week calculation accuracy
    - Test on iOS and Android devices
    - Test with different screen sizes
    - _Requirements: All_

- [ ]* 8. Documentation and polish
  - [ ]* 8.1 Update API documentation
    - Document journal endpoints in OpenAPI/Swagger
    - Add example requests and responses
    - Document error codes and messages
    - _Requirements: 5.1-5.7_
  
  - [ ]* 8.2 Create user-facing documentation
    - Write help text for barcode scanner
    - Create notification settings guide
    - Document journal tracking features
    - Add pregnancy week calculation explanation
    - _Requirements: All_
  
  - [ ]* 8.3 Performance optimization
    - Implement debouncing for barcode scan detection
    - Add pagination for journal entry list
    - Optimize chart rendering with memoization
    - Test and optimize notification scheduling
    - _Requirements: All_
