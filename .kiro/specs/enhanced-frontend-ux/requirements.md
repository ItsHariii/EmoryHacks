# Requirements Document

## Introduction

This specification defines the requirements for creating an exceptional, comforting, and data-accurate frontend experience for Aurea, a pregnancy nutrition tracking application. The frontend must seamlessly integrate with the existing backend API, display real-time pregnancy progress (trimester, week), accurately track and display macro and micronutrients without mock values, and provide a warm, supportive user experience that reduces anxiety and promotes healthy pregnancy habits.

## Glossary

- **Aurea Frontend**: The React Native mobile application that provides the user interface for pregnancy nutrition tracking
- **Backend API**: The FastAPI Python backend that manages user data, food logging, nutrition calculations, and journal entries
- **User**: A pregnant person using the Aurea application to track nutrition and wellness
- **Pregnancy Week**: The current week of pregnancy (1-40) calculated from the user's due date
- **Trimester**: One of three pregnancy periods (First: weeks 1-13, Second: weeks 14-27, Third: weeks 28-40)
- **Macronutrients**: Primary nutrients including calories, protein, carbohydrates, and fat
- **Micronutrients**: Essential vitamins and minerals including folate, iron, calcium, DHA, choline, vitamin D, vitamin B12, and magnesium
- **Food Log**: A record of food consumed by the user with associated nutritional data
- **Journal Entry**: A daily wellness record including mood, symptoms, sleep quality, and energy levels
- **Nutrition Target**: Trimester-specific daily nutritional goals calculated by the backend
- **Safety Status**: Food safety classification (safe, limited, avoid) for pregnancy

## Requirements

### Requirement 1: Real-Time Pregnancy Progress Display

**User Story:** As a pregnant user, I want to see my current pregnancy week, trimester, and days until due date accurately calculated and displayed, so that I can track my pregnancy journey and understand my changing nutritional needs.

#### Acceptance Criteria

1. WHEN THE User opens the Dashboard, THE Aurea Frontend SHALL fetch the User's due date from the Backend API and calculate the current pregnancy week using the formula: weeks = floor((280 - days_until_due) / 7) + 1
2. WHEN THE pregnancy week is calculated, THE Aurea Frontend SHALL determine the trimester WHERE week <= 13 is trimester 1, WHERE week >= 14 AND week <= 27 is trimester 2, WHERE week >= 28 is trimester 3
3. WHEN THE User's pregnancy week changes to a new week, THE Aurea Frontend SHALL display a celebratory week transition animation with week-specific developmental milestones
4. THE Aurea Frontend SHALL display a visual progress indicator showing the current week out of 40 total weeks with a percentage-based progress bar
5. THE Aurea Frontend SHALL display trimester-specific nutritional guidance and tips based on the current trimester value

### Requirement 2: Accurate Macronutrient Tracking and Display

**User Story:** As a pregnant user, I want to see my daily macronutrient intake (calories, protein, carbs, fat) accurately calculated from my food logs and compared against my trimester-specific targets, so that I can ensure I'm meeting my nutritional needs.

#### Acceptance Criteria

1. WHEN THE User views the Dashboard, THE Aurea Frontend SHALL fetch the daily nutrition summary from the Backend API endpoint `/food/nutrition-summary` with no mock or placeholder values
2. WHEN THE nutrition summary is received, THE Aurea Frontend SHALL display the total calories, protein grams, carbohydrate grams, and fat grams consumed for the current day
3. WHEN THE User views macronutrient progress, THE Aurea Frontend SHALL fetch trimester-specific nutrition targets from the Backend API endpoint `/users/nutrition-targets`
4. THE Aurea Frontend SHALL display visual progress bars for each macronutrient showing current intake versus target with percentage completion
5. WHEN THE User's intake exceeds 100% of the target, THE Aurea Frontend SHALL display the progress bar in a distinct color to indicate goal achievement without negative messaging
6. THE Aurea Frontend SHALL update macronutrient displays in real-time WHEN THE User logs new food entries

### Requirement 3: Comprehensive Micronutrient Tracking

**User Story:** As a pregnant user, I want to see my intake of critical pregnancy micronutrients (folate, iron, calcium, DHA, choline, vitamin D, vitamin B12, magnesium) accurately tracked from my food logs, so that I can identify nutritional gaps and make informed dietary choices.

#### Acceptance Criteria

1. WHEN THE User views the micronutrient section, THE Aurea Frontend SHALL extract micronutrient data from the `micronutrients` JSONB field in food log responses from the Backend API
2. THE Aurea Frontend SHALL display current intake values for folate (mcg), iron (mg), calcium (mg), DHA (mg), choline (mg), vitamin D (IU), vitamin B12 (mcg), and magnesium (mg) calculated from actual food log data
3. WHEN THE User taps on a micronutrient, THE Aurea Frontend SHALL display an educational modal explaining the nutrient's importance during pregnancy and food sources rich in that nutrient
4. THE Aurea Frontend SHALL display visual indicators (color-coded bars or icons) showing whether each micronutrient intake is below target, near target, or at target
5. WHEN THE micronutrient intake is below 70% of the target, THE Aurea Frontend SHALL display gentle suggestions for food sources rich in that nutrient without alarming language

### Requirement 4: Comforting and Supportive Visual Design

**User Story:** As a pregnant user, I want the app interface to feel warm, calming, and supportive, so that I feel encouraged and reassured rather than stressed about my nutrition tracking.

#### Acceptance Criteria

1. THE Aurea Frontend SHALL use a soft, warm color palette with primary colors in pastel or muted tones (soft blues, gentle pinks, warm creams) that evoke calmness
2. THE Aurea Frontend SHALL use rounded corners with border radius >= 12px on all cards, buttons, and containers to create a softer, friendlier appearance
3. THE Aurea Frontend SHALL use gentle, encouraging language in all user-facing text, avoiding words like "failed," "missed," or "insufficient"
4. WHEN THE User has not met a nutritional target, THE Aurea Frontend SHALL display supportive messages such as "You're doing great! Here are some foods to help you reach your goal" instead of negative feedback
5. THE Aurea Frontend SHALL use smooth animations with easing functions for all transitions, with animation durations between 200-400ms to create a fluid, calming experience
6. THE Aurea Frontend SHALL display pregnancy-positive illustrations or icons (baby footprints, hearts, gentle curves) throughout the interface
7. THE Aurea Frontend SHALL use adequate white space (minimum 16px padding) between sections to prevent visual overwhelm

### Requirement 5: Intuitive Food Logging Experience

**User Story:** As a pregnant user, I want to quickly and easily log my meals with accurate serving sizes and see immediate feedback on nutritional content, so that I can maintain consistent tracking without frustration.

#### Acceptance Criteria

1. WHEN THE User searches for food, THE Aurea Frontend SHALL display search results from the Backend API with food name, brand, serving size, and safety status clearly visible
2. WHEN THE User selects a food item, THE Aurea Frontend SHALL display a serving size selector with common serving options (1 cup, 1 serving, 100g, custom) and a quantity adjuster
3. THE Aurea Frontend SHALL calculate and display the nutritional content for the selected serving size and quantity before the User confirms the log entry
4. WHEN THE User logs a food item, THE Aurea Frontend SHALL display the food's safety status (safe, limited, avoid) with color-coded indicators (green, yellow, red) and explanatory notes
5. WHEN THE food log is successfully saved, THE Aurea Frontend SHALL display a brief success confirmation and immediately update the dashboard nutrition summary
6. THE Aurea Frontend SHALL provide a barcode scanning feature that fetches product data from the Backend API and pre-fills the food logging form

### Requirement 6: Personalized Dashboard Experience

**User Story:** As a pregnant user, I want my dashboard to show personalized information relevant to my current pregnancy stage, today's nutrition progress, and wellness tracking, so that I can quickly understand my status at a glance.

#### Acceptance Criteria

1. WHEN THE User opens the Dashboard, THE Aurea Frontend SHALL display a personalized greeting using the User's first name from the Backend API user data
2. THE Aurea Frontend SHALL display the current pregnancy week component at the top of the Dashboard with week number, trimester name, days until due date, and a week-specific tip
3. THE Aurea Frontend SHALL display today's macronutrient progress section showing all four macronutrients with visual progress bars
4. THE Aurea Frontend SHALL display a micronutrient tracking section showing the eight critical pregnancy nutrients with current intake and targets
5. WHEN THE User has created a journal entry for today, THE Aurea Frontend SHALL display a summary card showing mood, symptoms, and a link to view the full entry
6. THE Aurea Frontend SHALL display quick action buttons for common tasks (Log Food, Scan Barcode, Create Journal Entry) prominently on the Dashboard
7. THE Aurea Frontend SHALL implement pull-to-refresh functionality that fetches updated data from all relevant Backend API endpoints

### Requirement 7: Comprehensive Journal and Wellness Tracking

**User Story:** As a pregnant user, I want to track my daily mood, symptoms, sleep quality, and energy levels, so that I can identify patterns and share comprehensive information with my healthcare provider.

#### Acceptance Criteria

1. WHEN THE User creates a journal entry, THE Aurea Frontend SHALL provide input fields for entry date, symptoms (multi-select), mood (1-5 scale), cravings (text), sleep quality (1-5 scale), energy level (1-5 scale), and notes (text)
2. THE Aurea Frontend SHALL display mood, sleep quality, and energy level as visual scales with emoji or icon representations for each level (1=worst, 5=best)
3. THE Aurea Frontend SHALL provide a predefined list of common pregnancy symptoms (nausea, fatigue, back pain, headache, heartburn, swelling, etc.) with the ability to add custom symptoms
4. WHEN THE User saves a journal entry, THE Aurea Frontend SHALL send the data to the Backend API endpoint `/journal/entries` with all fields properly formatted
5. WHEN THE User views journal history, THE Aurea Frontend SHALL display entries in reverse chronological order with date, mood indicator, and symptom count visible
6. THE Aurea Frontend SHALL allow the User to edit or delete existing journal entries with confirmation dialogs for destructive actions

### Requirement 8: Trimester-Specific Nutritional Guidance

**User Story:** As a pregnant user, I want to receive nutritional guidance and targets that adjust based on my current trimester, so that my nutrition goals align with my baby's developmental needs and my changing body.

#### Acceptance Criteria

1. WHEN THE User's trimester changes, THE Aurea Frontend SHALL fetch updated nutrition targets from the Backend API endpoint `/users/nutrition-targets`
2. THE Aurea Frontend SHALL display trimester-specific calorie targets WHERE trimester 1 requires base calories, WHERE trimester 2 requires base + 340 calories, WHERE trimester 3 requires base + 450 calories
3. THE Aurea Frontend SHALL display trimester-specific micronutrient targets with increased calcium requirements in trimesters 2 and 3
4. WHEN THE User views nutritional guidance, THE Aurea Frontend SHALL display trimester-specific educational content explaining why certain nutrients are particularly important in the current stage
5. THE Aurea Frontend SHALL adjust macronutrient distribution recommendations based on trimester-specific needs fetched from the Backend API

### Requirement 9: Food Safety Information Integration

**User Story:** As a pregnant user, I want to see clear safety information for foods I'm considering or have logged, so that I can make informed decisions and avoid foods that may be harmful during pregnancy.

#### Acceptance Criteria

1. WHEN THE User views a food item in search results or food logs, THE Aurea Frontend SHALL display the safety status (safe, limited, avoid) from the Backend API food data
2. THE Aurea Frontend SHALL use color-coded visual indicators WHERE safe foods display green indicators, WHERE limited foods display yellow indicators, WHERE avoid foods display red indicators
3. WHEN THE User taps on a food's safety indicator, THE Aurea Frontend SHALL display a modal with detailed safety notes from the Backend API explaining why the food has that classification
4. WHEN THE User attempts to log a food with "avoid" status, THE Aurea Frontend SHALL display a gentle warning modal with safety information and require explicit confirmation before logging
5. THE Aurea Frontend SHALL display safety information from the `safety_status` and `safety_notes` fields in the Backend API food responses without modification

### Requirement 10: Offline Capability and Data Synchronization

**User Story:** As a pregnant user, I want to log food and journal entries even when I don't have internet connectivity, so that I can maintain consistent tracking regardless of my location.

#### Acceptance Criteria

1. WHEN THE User logs food or creates a journal entry without internet connectivity, THE Aurea Frontend SHALL store the entry locally using AsyncStorage
2. WHEN THE internet connection is restored, THE Aurea Frontend SHALL automatically synchronize locally stored entries with the Backend API
3. THE Aurea Frontend SHALL display a visual indicator (icon or banner) when operating in offline mode
4. WHEN THE synchronization completes successfully, THE Aurea Frontend SHALL display a brief confirmation message and remove the offline indicator
5. THE Aurea Frontend SHALL cache the most recent nutrition summary, user profile, and nutrition targets for offline viewing

### Requirement 11: Accessibility and Inclusive Design

**User Story:** As a pregnant user with visual or motor impairments, I want the app to be fully accessible with screen reader support and appropriate touch targets, so that I can use all features independently.

#### Acceptance Criteria

1. THE Aurea Frontend SHALL provide accessibility labels for all interactive elements using the `accessibilityLabel` prop
2. THE Aurea Frontend SHALL ensure all touchable elements have a minimum size of 44x44 pixels to meet accessibility guidelines
3. THE Aurea Frontend SHALL provide sufficient color contrast (minimum 4.5:1 ratio) between text and background colors
4. THE Aurea Frontend SHALL support dynamic text sizing to accommodate users who need larger text
5. THE Aurea Frontend SHALL provide `accessibilityHint` props for complex interactions to guide screen reader users

### Requirement 12: Performance and Responsiveness

**User Story:** As a pregnant user, I want the app to load quickly and respond immediately to my interactions, so that I can efficiently track my nutrition without waiting or frustration.

#### Acceptance Criteria

1. WHEN THE User navigates to any screen, THE Aurea Frontend SHALL display the screen within 500 milliseconds
2. WHEN THE User performs an action (button press, form submission), THE Aurea Frontend SHALL provide immediate visual feedback (loading indicator, button state change) within 100 milliseconds
3. THE Aurea Frontend SHALL implement pagination for food search results to load 20 items at a time and support infinite scrolling
4. THE Aurea Frontend SHALL cache API responses for frequently accessed data (user profile, nutrition targets) with a 5-minute expiration
5. WHEN THE Backend API request takes longer than 3 seconds, THE Aurea Frontend SHALL display a loading indicator with encouraging text such as "Preparing your nutrition data..."
