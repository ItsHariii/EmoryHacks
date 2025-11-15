# Requirements Document

## Introduction

This specification defines the User Experience and Engagement features for the Ovi Pregnancy Nutrition App. These features focus on enhancing user interaction through barcode scanning for quick food logging, comprehensive journal and mood tracking capabilities, push notification reminders, and improved UI/UX elements including visual nutrient charts and pregnancy week displays.

## Glossary

- **System**: The Ovi Pregnancy Nutrition mobile application (React Native/Expo frontend)
- **User**: A pregnant individual using the application to track nutrition and wellness
- **Barcode Scanner**: A component that uses device camera to scan product barcodes
- **Journal Entry**: A user-created record of symptoms, mood, cravings, sleep, or energy levels
- **Push Notification**: A system-generated alert sent to the user's device
- **Nutrient Chart**: A visual representation of daily nutrient intake versus targets
- **Pregnancy Week Display**: A UI component showing current week of pregnancy and trimester
- **Food Database API**: External services (OpenFoodFacts, USDA) providing food nutrition data
- **Backend API**: The FastAPI server providing data and business logic

## Requirements

### Requirement 1: Barcode Scanning for Food Logging

**User Story:** As a User, I want to scan product barcodes to quickly log packaged foods, so that I can save time and ensure accurate nutrition data entry.

#### Acceptance Criteria

1. WHEN the User opens the barcode scanner, THE System SHALL activate the device camera with a scanning overlay
2. WHEN a valid barcode is detected, THE System SHALL query the Food Database API to retrieve product information
3. IF the Food Database API returns product data, THEN THE System SHALL display the food name, brand, and nutrition information for User confirmation
4. WHEN the User confirms the scanned product, THE System SHALL create a food log entry with the retrieved nutrition data
5. IF the Food Database API does not return product data, THEN THE System SHALL display a message indicating the product was not found and offer manual entry
6. THE System SHALL support UPC-A, UPC-E, EAN-8, and EAN-13 barcode formats
7. WHEN the User cancels the barcode scan, THE System SHALL return to the previous screen without creating a log entry

### Requirement 2: Journal and Mood Tracking

**User Story:** As a User, I want to track my daily symptoms, mood, cravings, sleep quality, and energy levels, so that I can identify patterns and correlations with my nutrition.

#### Acceptance Criteria

1. THE System SHALL provide a journal entry form with fields for date, symptoms, mood, cravings, sleep quality, and energy level
2. WHEN the User creates a journal entry, THE System SHALL save the entry to the Backend API with a timestamp
3. THE System SHALL display a chronological list of past journal entries with date and summary information
4. WHEN the User selects a past journal entry, THE System SHALL display the full entry details
5. THE System SHALL allow the User to edit or delete existing journal entries
6. THE System SHALL provide predefined options for common symptoms (nausea, fatigue, headache, back pain, swelling)
7. THE System SHALL provide a mood scale from 1 to 5 with emoji representations
8. THE System SHALL allow free-text entry for cravings and additional notes
9. THE System SHALL provide a sleep quality scale from 1 to 5 (poor to excellent)
10. THE System SHALL provide an energy level scale from 1 to 5 (very low to very high)

### Requirement 3: Push Notifications and Reminders

**User Story:** As a User, I want to receive timely reminders for hydration, supplements, and meal logging, so that I can maintain consistent healthy habits throughout my pregnancy.

#### Acceptance Criteria

1. THE System SHALL request notification permissions from the User during onboarding or first use
2. WHEN notification permissions are granted, THE System SHALL enable push notification functionality
3. THE System SHALL allow the User to configure notification preferences including types and times
4. THE System SHALL send hydration reminders at User-configured intervals (default: every 2 hours during waking hours)
5. THE System SHALL send supplement reminders at User-configured times (default: 8:00 AM for prenatal vitamin)
6. THE System SHALL send meal logging reminders at User-configured meal times (default: 8:00 AM, 12:00 PM, 6:00 PM)
7. WHEN the User taps a notification, THE System SHALL navigate to the relevant screen (water tracking, supplement log, or food logging)
8. THE System SHALL allow the User to disable specific notification types in settings
9. THE System SHALL respect device Do Not Disturb settings and quiet hours
10. THE System SHALL display notification history within the app for missed reminders

### Requirement 4: Enhanced UI/UX with Visual Charts

**User Story:** As a User, I want to see visual representations of my nutrient intake and pregnancy progress, so that I can quickly understand my nutritional status and pregnancy stage.

#### Acceptance Criteria

1. THE System SHALL display the User's current pregnancy week and trimester on the dashboard
2. THE System SHALL calculate pregnancy week based on the User's due date stored in their profile
3. THE System SHALL display visual progress bars for daily macronutrient goals (calories, protein, carbs, fat)
4. THE System SHALL display visual indicators for pregnancy-specific micronutrients (folate, iron, calcium, DHA, choline)
5. THE System SHALL use color coding to indicate nutrient status: green for met goals, yellow for approaching goals, and red for significantly below goals
6. WHEN the User taps a nutrient indicator, THE System SHALL display detailed information about that nutrient and its importance during pregnancy
7. THE System SHALL display a weekly transition animation when the pregnancy week changes
8. THE System SHALL provide an improved onboarding flow with pregnancy information collection
9. THE System SHALL use consistent theming (maroon/burgundy palette) across all new screens
10. THE System SHALL ensure all visual elements meet accessibility contrast requirements (WCAG AA standard)

### Requirement 5: Backend Support for Journal Entries

**User Story:** As a User, I want my journal entries to be securely stored and synchronized across devices, so that I can access my health history from anywhere.

#### Acceptance Criteria

1. THE Backend API SHALL provide an endpoint to create journal entries with fields for user_id, date, symptoms, mood, cravings, sleep_quality, energy_level, and notes
2. THE Backend API SHALL provide an endpoint to retrieve journal entries for a User with optional date range filtering
3. THE Backend API SHALL provide an endpoint to update existing journal entries
4. THE Backend API SHALL provide an endpoint to delete journal entries
5. THE Backend API SHALL validate that Users can only access their own journal entries
6. THE Backend API SHALL store journal entries in the Supabase database with proper indexing on user_id and date
7. THE Backend API SHALL return journal entries in reverse chronological order (newest first)
