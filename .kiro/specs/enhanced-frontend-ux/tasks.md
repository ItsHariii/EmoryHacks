# Implementation Plan

- [x] 1. Set up enhanced theme system and design tokens
  - Create new theme file with soft, warm color palette (soft rose pink #E8B4B8, sky blue #B8D4E8, warm cream #F4D9A6)
  - Define typography system with font sizes, weights, and line heights
  - Define spacing system (4px, 8px, 16px, 24px, 32px, 48px)
  - Define border radius values (4px, 8px, 12px, 16px, 24px)
  - Define shadow styles for elevation (sm, md, lg)
  - Define animation timings and easing functions
  - Export theme object for use throughout the app
  - _Requirements: 4.1, 4.2, 4.7_

- [x] 2. Create base reusable UI components
- [x] 2.1 Create Card component with soft shadows and rounded corners
  - Implement Card component with configurable padding, margin, and border radius
  - Add shadow prop for elevation levels (sm, md, lg)
  - Support onPress for tappable cards
  - Add accessibility props (accessibilityRole, accessibilityLabel)
  - _Requirements: 4.2, 11.1, 11.2_

- [x] 2.2 Create Button component with multiple variants
  - Implement primary, secondary, and outline button variants
  - Add loading state with spinner
  - Add disabled state with reduced opacity
  - Ensure minimum 44x44 touch target
  - Add haptic feedback on press
  - _Requirements: 4.2, 11.2_

- [x] 2.3 Create Input component with validation states
  - Implement TextInput wrapper with consistent styling
  - Add error state with red border and error message
  - Add success state with green border
  - Add label and helper text support
  - Implement accessibility labels and hints
  - _Requirements: 11.1, 11.3_

- [x] 2.4 Create LoadingSpinner component with encouraging messages
  - Implement animated spinner with theme colors
  - Add optional message prop for context-specific loading text
  - Use encouraging messages like "Preparing your nutrition data..."
  - _Requirements: 12.5_

- [x] 2.5 Create Toast notification component
  - Implement toast with success, error, warning, and info variants
  - Add auto-dismiss with configurable duration
  - Position at top of screen with slide-in animation
  - Support manual dismiss with swipe gesture
  - _Requirements: 4.5_

- [x] 2.6 Create icon system and visual polish components
- [x] 2.6.1 Set up consistent icon library
  - Install and configure @expo/vector-icons with MaterialCommunityIcons
  - Create IconWrapper component that places icons in soft circular/rounded-square containers
  - Use theme's pale rose (#F5D5D8) or cream (#F9ECD4) as icon background colors
  - Define three icon sizes: small (14-16), medium (20-22), large (28-32)
  - Add 12-16px padding for card icons, 6-8px for badges, 10-12px for buttons
  - _Requirements: 4.2, 4.7_

- [x] 2.6.2 Create icon mapping constants
  - Define icon constants for all app features using MaterialCommunityIcons
  - Trimester icons: sprout (T1), flower-outline (T2), baby-face-outline (T3)
  - Nutrient icons: flame (calories), food-drumstick (protein), bread-slice (carbs), food-apple (fat)
  - Micronutrient icons: white-balance-sunny (vitamin D), fish (DHA), leaf (folate), etc.
  - Safety status icons: check-circle-outline (safe), alert-circle-outline (limited), close-circle-outline (avoid)
  - Mood icons: emoticon-sad-outline, emoticon-neutral-outline, emoticon-happy-outline (5 levels)
  - Use only 2-3 colors: deep plum (text.primary), soft rose (primary), muted sky blue (secondary)
  - _Requirements: 4.2, 4.7_

- [x] 2.6.3 Create IconBadge component
  - Implement circular or rounded-square icon container
  - Accept size prop (small, medium, large)
  - Accept backgroundColor and iconColor props from theme
  - Add optional subtle gradient ring backdrop for key features
  - Include scale-down animation on press (95% scale with spring back)
  - _Requirements: 4.2, 4.5_

- [x] 2.6.4 Add micro-animations utility
  - Create animation helpers for icon interactions
  - Scale-down on press (95% with spring back)
  - Fade-in and slide-up on mount (10-12px movement)
  - Subtle pulse animation for progress indicators
  - Export reusable animation configs
  - _Requirements: 4.5_

- [x] 3. Implement custom hooks for data management
- [x] 3.1 Create useNutritionData hook
  - Fetch nutrition summary from `/food/nutrition-summary` endpoint
  - Fetch nutrition targets from `/users/nutrition-targets` endpoint
  - Implement caching with 5-minute TTL using AsyncStorage
  - Handle loading and error states
  - Provide refresh function to force re-fetch
  - Return { summary, targets, loading, error, refresh }
  - _Requirements: 2.1, 2.3, 12.4_

- [x] 3.2 Create usePregnancyProgress hook
  - Calculate current week from due date: weeks = floor((280 - days_until_due) / 7) + 1
  - Determine trimester: 1-13 weeks = trimester 1, 14-27 = trimester 2, 28-40 = trimester 3
  - Check AsyncStorage for last seen week
  - Detect week changes and trigger transition animation
  - Return { pregnancyInfo, weekChanged, dismissWeekChange }
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.3 Create useMicronutrientCalculator hook
  - Extract micronutrients from food log responses
  - Sum totals for folate, iron, calcium, DHA, choline, vitamin D, vitamin B12, magnesium
  - Calculate percentage of target for each nutrient
  - Format data for chart display
  - Return array of MicronutrientData objects
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3.4 Create useOfflineSync hook
  - Monitor network connectivity using NetInfo
  - Queue actions in AsyncStorage when offline
  - Auto-sync pending actions when connection restored
  - Provide isOnline status and pendingActions count
  - Return { isOnline, queueAction, syncPendingActions, pendingActions }
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 4. Build PregnancyWeekCard component
- [x] 4.1 Create component structure and layout
  - Display large week number (48px font) in primary color with subtle gradient ring backdrop
  - Show trimester name in bold with elegant icon (sprout for T1, flower-outline for T2, baby-face-outline for T3)
  - Place trimester icon in soft circular container using IconBadge component
  - Display days until due date
  - Add visual divider between week number and trimester info
  - Use Card component as base with lg shadow
  - NO emojis - use only MaterialCommunityIcons
  - _Requirements: 1.1, 1.2, 1.4, 6.2_

- [x] 4.2 Implement progress bar visualization
  - Calculate progress percentage: (week / 40) * 100
  - Display horizontal progress bar with gradient fill
  - Show "Week X of 40" text below bar
  - Animate progress bar fill on mount
  - _Requirements: 1.4_

- [x] 4.3 Add week-specific tip display
  - Fetch week-specific tip from pregnancyCalculations utility
  - Display tip in highlighted box with lightbulb-outline icon in circular container
  - Use soft background color (#F9ECD4) and left border accent
  - Place icon with 12-16px padding, never touching edges
  - Make tip accessible with proper labels
  - _Requirements: 1.5, 11.1_

- [x] 5. Build MacronutrientCard component
- [x] 5.1 Create card layout with nutrient information
  - Display nutrient name with clean icon in soft circular backdrop at top
  - Use MaterialCommunityIcons: flame (calories), food-drumstick (protein), bread-slice (carbs), food-apple (fat)
  - Place each icon inside IconBadge with theme color backgrounds
  - Show current value in large font (24px)
  - Display target value below progress bar
  - Use color prop for progress bar and accents
  - Maintain 12-16px padding around icons
  - _Requirements: 2.2, 2.4_

- [x] 5.2 Implement progress bar with percentage
  - Calculate percentage: (current / target) * 100
  - Display horizontal progress bar with animated fill
  - Show percentage text on right side
  - Use distinct color when exceeding 100% (success green)
  - _Requirements: 2.4, 2.5_

- [x] 5.3 Add encouraging messages for goal achievement
  - Display "Great job!" message when >= 100% of target
  - Show "Almost there!" when >= 80% of target
  - Display "Keep going!" when < 80% of target
  - Use positive, supportive language
  - _Requirements: 4.4_

- [x] 6. Build MicronutrientChart component
- [x] 6.1 Create chart layout with nutrient bars
  - Display horizontal bar for each of 8 micronutrients
  - Add small, subtle supportive icons (sun for vitamin D, fish for DHA, leaf for folate) at 14-16px size
  - Show nutrient name, current value, and target value
  - Calculate percentage of target for each nutrient
  - Use color-coding: red <70%, yellow 70-90%, green >90%
  - Animate bars filling on mount with subtle icon pulse
  - _Requirements: 3.2, 3.4_

- [x] 6.2 Implement expandable nutrient details
  - Make each nutrient bar tappable with scale-down animation (95%)
  - Show modal with importance explanation on tap
  - Display food sources rich in the nutrient with small icons
  - Add smooth expand/collapse animation with slide-in
  - Keep icons minimal and outlined, not filled
  - _Requirements: 3.3_

- [x] 6.3 Add gentle suggestions for low nutrients
  - Detect nutrients below 70% of target
  - Display suggestion card with food sources
  - Use encouraging language: "Try adding these foods..."
  - Avoid alarming or negative messaging
  - _Requirements: 3.5, 4.4_

- [x] 7. Build FoodSafetyBadge component
  - Create pill-shaped badge with status text
  - Use green for "safe", yellow for "limited", red for "avoid"
  - Replace emojis with MaterialCommunityIcons circle icons: check-circle-outline (safe), alert-circle-outline (limited), close-circle-outline (avoid)
  - Place icon on left of label inside pill badge with 6-8px padding
  - Use small icon size (14-16px)
  - Make badge tappable with scale animation to show detailed notes modal
  - Display safety_notes from backend in modal
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 8. Build JournalMoodSelector component
  - Replace emojis with expressive outline emoticon icons from MaterialCommunityIcons
  - Use 5 icons arranged in a row: emoticon-sad-outline, emoticon-frown-outline, emoticon-neutral-outline, emoticon-happy-outline, emoticon-excited-outline
  - Highlight selected icon with filled version and soft circular background
  - Place each icon in IconBadge component with medium size (20-22px)
  - Add label above selector with neutral, warm language
  - Implement smooth scale animation on selection (95% scale down, spring back)
  - Make accessible with proper labels for each mood level
  - _Requirements: 7.2, 11.1_

- [x] 9. Build WeekTransitionModal component
  - Create full-screen modal with semi-transparent background
  - Animate week number entrance with scale and fade
  - Display developmental milestone for the week
  - Add confetti or sparkle particle animation
  - Include "Continue" button to dismiss
  - Store dismissed week in AsyncStorage
  - _Requirements: 1.3_

- [x] 10. Enhance Dashboard screen with real data integration
- [x] 10.1 Implement data fetching on mount
  - Fetch user profile from `/users/me`
  - Fetch nutrition summary from `/food/nutrition-summary`
  - Fetch nutrition targets from `/users/nutrition-targets`
  - Fetch today's journal entry from `/journal/entries?start_date={today}&end_date={today}`
  - Handle loading states with skeleton screens
  - Handle errors with friendly error messages
  - _Requirements: 2.1, 2.3, 6.1, 6.2, 12.1_

- [x] 10.2 Display personalized greeting and pregnancy info
  - Show greeting with user's first name from API
  - Display PregnancyWeekCard with calculated week and trimester
  - Show week transition modal if week changed
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2_

- [x] 10.3 Display macronutrient progress section
  - Create grid of 4 MacronutrientCard components
  - Pass calories, protein, carbs, fat from nutrition summary
  - Pass targets from nutrition targets API
  - Update in real-time when food is logged
  - _Requirements: 2.2, 2.4, 2.6, 6.3_

- [x] 10.4 Display micronutrient tracking section
  - Use MicronutrientChart component
  - Calculate micronutrient totals using useMicronutrientCalculator hook
  - Pass targets from nutrition targets API
  - Show section title and subtitle
  - _Requirements: 3.1, 3.2, 3.4, 6.4_

- [x] 10.5 Display today's journal summary
  - Show journal summary card if entry exists for today
  - Display mood emoji, symptoms preview
  - Make card tappable to navigate to full entry
  - Hide section if no entry exists
  - _Requirements: 6.5, 7.1_

- [x] 10.6 Add quick action buttons
  - Create "Log Food" button navigating to FoodLoggingScreen
  - Create "Scan Barcode" button navigating to BarcodeScannerScreen
  - Create "Create Journal Entry" button navigating to JournalEntryScreen
  - Ensure buttons meet 44x44 minimum touch target
  - _Requirements: 6.6, 11.2_

- [x] 10.7 Implement pull-to-refresh functionality
  - Add RefreshControl to ScrollView
  - Refresh all data sources on pull
  - Show loading indicator during refresh
  - Display success toast on completion
  - _Requirements: 6.7_

- [x] 11. Enhance FoodLogging screen with improved UX
- [x] 11.1 Implement real-time food search
  - Add search input with debouncing (300ms)
  - Fetch results from `/food/search?q={query}` endpoint
  - Display results in FlatList with pagination
  - Show food name, brand, serving size, safety status
  - Implement infinite scroll for more results
  - _Requirements: 5.1, 12.3_

- [x] 11.2 Create serving size selector
  - Display common serving options (1 cup, 1 serving, 100g, custom)
  - Add quantity adjuster with +/- buttons
  - Show selected serving size and quantity
  - Calculate nutrition for selected amount
  - _Requirements: 5.2_

- [x] 11.3 Implement nutrition preview
  - Calculate calories, protein, carbs, fat for selected serving
  - Display preview card before logging
  - Show safety status with FoodSafetyBadge
  - Update preview in real-time as serving changes
  - _Requirements: 5.3_

- [x] 11.4 Add safety warning for "avoid" foods
  - Detect when selected food has "avoid" status
  - Display modal with safety notes from backend
  - Require explicit confirmation to proceed
  - Use gentle, informative language
  - _Requirements: 5.4, 9.4_

- [x] 11.5 Implement food logging submission
  - POST to `/food/log` endpoint with food_id, serving_size, serving_unit, quantity, meal_type
  - Show loading indicator during submission
  - Display success toast on completion
  - Navigate back to Dashboard and refresh data
  - _Requirements: 5.5, 2.6_

- [x] 11.6 Add recent foods section
  - Fetch recent foods from `/food/recent` endpoint
  - Display in horizontal scrollable list
  - Allow quick logging by tapping recent food
  - _Requirements: 5.1_

- [x] 12. Enhance Journal screen with comprehensive tracking
- [x] 12.1 Create journal entry form
  - Add date picker for entry_date
  - Add JournalMoodSelector for mood (1-5)
  - Add JournalMoodSelector for sleep_quality (1-5)
  - Add JournalMoodSelector for energy_level (1-5)
  - Add multi-select for symptoms with common pregnancy symptoms
  - Add text input for cravings
  - Add text area for notes
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 12.2 Implement journal entry submission
  - POST to `/journal/entries` endpoint with all form data
  - Validate required fields (entry_date)
  - Show loading indicator during submission
  - Display success toast on completion
  - Navigate to journal history
  - _Requirements: 7.4_

- [x] 12.3 Create journal history view
  - Fetch entries from `/journal/entries` endpoint
  - Display in reverse chronological order
  - Show date, mood emoji, symptom count for each entry
  - Implement date range filtering
  - Make entries tappable to view details
  - _Requirements: 7.5_

- [x] 12.4 Implement entry edit and delete
  - Add edit button on entry detail view
  - PUT to `/journal/entries/{id}` with updated data
  - Add delete button with confirmation dialog
  - DELETE to `/journal/entries/{id}` on confirm
  - Navigate back to history on completion
  - _Requirements: 7.6_

- [x] 13. Enhance Profile screen with editable information
- [x] 13.1 Display user information
  - Show name, email from user profile
  - Display due date, current week, trimester
  - Use PregnancyWeekCard for pregnancy info
  - _Requirements: 6.1_

- [x] 13.2 Implement profile editing
  - Add "Edit Profile" button
  - Show modal with editable fields (first_name, last_name, due_date)
  - PATCH to `/users/me` with updates
  - Refresh user data on success
  - _Requirements: 8.1_







- [x] 14. Add smooth animations and transitions (VISUAL PRIORITY)
  - Implement smooth screen transitions (300ms ease-in-out)
  - Add fade-in and slide-up animation (10-12px) for Dashboard sections on mount
  - Animate progress bar fills with subtle icon pulse as bars complete
  - Add scale animation for button presses (95% scale down with spring back)
  - Implement slide-in animation for modals
  - Add micro-animations to all icon interactions using animation utility
  - Ensure all animations feel alive but not distracting
  - _Requirements: 4.5_


- [x] 15. Redesign navigation header with premium feel (VISUAL PRIORITY)
- [x] 15.1 Create custom header component
  - Replace default navigation header with custom HeaderBar component
  - Add gradient background (soft rose to cream) with subtle shadow
  - Display screen title with elegant typography (24-28px, bold)
  - Add user avatar/initials in circular badge on right
  - Include notification bell icon with badge count
  - Add subtle animation on scroll (shrink header slightly)
  - Ensure proper safe area handling for notch devices
  - _Requirements: 4.2, 4.7, 11.1_

- [x] 15.2 Add contextual header actions
  - Show relevant action buttons per screen (Edit on Profile, Filter on Journal)
  - Use IconBadge component for header action buttons
  - Add haptic feedback on button press
  - Ensure 44x44 minimum touch target
  - Animate button appearance with fade-in
  - _Requirements: 4.5, 11.2_

- [x] 15.3 Implement header search bar (for food/journal screens)
  - Add expandable search bar that slides in from right
  - Use soft rounded corners and subtle shadow
  - Include clear button and search icon
  - Animate expansion/collapse smoothly
  - Show recent searches below when focused
  - _Requirements: 4.5, 5.1_

- [x] 16. Redesign bottom tab navigation with modern style (VISUAL PRIORITY)
- [x] 16.1 Create custom tab bar component
  - Replace default tab bar with custom TabBar component
  - Add floating tab bar with rounded corners and shadow
  - Position 16px from bottom with horizontal margins
  - Use soft background with blur effect (iOS) or elevation (Android)
  - Add subtle gradient ring behind active tab icon
  - Implement smooth tab switching animation
  - _Requirements: 4.2, 4.7_

- [x] 16.2 Enhance tab icons and labels
  - Use MaterialCommunityIcons for all tabs
  - Home: home-heart, Food: food-apple, Journal: book-open-variant, Profile: account-circle
  - Add scale animation on tab press (95% scale down, spring back)
  - Show label only for active tab with fade-in animation
  - Use primary color for active, muted gray for inactive
  - Add haptic feedback on tab change
  - _Requirements: 4.2, 4.5, 11.2_

- [x] 16.3 Add tab bar micro-interactions
  - Implement ripple effect on tab press (Android)
  - Add subtle bounce animation when switching tabs
  - Show badge count on Journal tab for unread entries
  - Animate badge appearance with scale and fade
  - _Requirements: 4.5_

- [x] 17. Add delightful empty states throughout app (VISUAL PRIORITY)
- [x] 17.1 Create EmptyState component
  - Design reusable empty state component with illustration area
  - Add supportive icon in soft circular container (large size)
  - Include friendly headline and descriptive text
  - Add primary action button ("Get Started", "Add Entry", etc.)
  - Use encouraging, warm language
  - Animate entrance with fade-in and slide-up
  - _Requirements: 4.4, 12.5_

- [x] 17.2 Implement empty states for all screens
  - Dashboard: "Welcome! Let's start tracking your nutrition"
  - Food Log: "No meals logged today. Ready to add your first?"
  - Journal: "Start your pregnancy journal today"
  - Search Results: "No foods found. Try a different search"
  - Micronutrients: "Log some meals to see your nutrient breakdown"
  - _Requirements: 4.4, 12.5_

- [x] 18. Add premium loading experiences (VISUAL PRIORITY)
- [x] 18.1 Create skeleton screens for all major views
  - Design skeleton components matching actual content layout
  - Use shimmer animation effect (gradient moving left to right)
  - Create skeletons for: Dashboard cards, Food list, Journal entries, Profile info
  - Ensure skeleton dimensions match real content
  - Animate skeleton appearance with fade-in
  - _Requirements: 12.2, 12.5_

- [x] 18.2 Implement progressive loading
  - Load critical content first (user info, current week)
  - Show skeleton for secondary content while loading
  - Fade in content as it becomes available
  - Avoid layout shifts during loading
  - _Requirements: 12.1, 12.5_

- [x] 19. Enhance screen transitions and navigation flow (VISUAL PRIORITY)
- [x] 19.1 Implement custom screen transitions
  - Add slide-from-right transition for stack navigation
  - Use fade transition for modal screens
  - Add scale transition for detail views
  - Ensure transitions are smooth (300ms duration)
  - _Requirements: 4.5_

- [x] 19.2 Add gesture-based navigation
  - Enable swipe-back gesture on iOS
  - Add swipe-to-dismiss for modals
  - Implement pull-down to close for bottom sheets
  - Ensure gestures feel natural and responsive
  - _Requirements: 4.5_

- [x] 20. Add celebration moments and positive reinforcement (VISUAL PRIORITY)
- [x] 20.1 Create CelebrationModal component
  - Design full-screen celebration modal with confetti animation
  - Show when user reaches nutrition goals
  - Display achievement message with encouraging text
  - Include "Continue" button to dismiss
  - Animate confetti particles with physics
  - _Requirements: 4.4, 4.5_

- [x] 20.2 Implement milestone celebrations
  - Celebrate when user logs first meal
  - Celebrate when user reaches 100% of daily calories
  - Celebrate when user completes first journal entry
  - Show celebration modal with unique message for each
  - Store celebrated milestones in AsyncStorage to avoid repeats
  - _Requirements: 4.4_

- [ ] 21. Enhance Dashboard with dynamic content (VISUAL PRIORITY)
- [ ] 21.1 Add daily tip card
  - Create rotating daily tips about pregnancy nutrition
  - Display in Card component with lightbulb icon
  - Change tip daily based on current date
  - Make card dismissible with swipe gesture
  - _Requirements: 1.5, 4.4_

- [ ] 21.2 Add quick stats summary
  - Show today's summary at top: meals logged, calories, protein
  - Display in horizontal scrollable cards
  - Use icons for each stat with IconBadge
  - Animate numbers counting up on mount
  - Make stats tappable to view details
  - _Requirements: 2.1, 4.5_



- [ ] 28. Final visual polish (HACKATHON PRIORITY)
- [ ] 28.1 Conduct comprehensive design review
  - Review all screens for visual consistency
  - Ensure spacing follows 8px grid system
  - Verify all colors are from theme palette
  - Check that all icons are properly sized and padded
  - Ensure all text uses theme typography
  - Verify all shadows and elevations are consistent
  - _Requirements: 4.1, 4.2, 4.7_

- [ ] 28.2 Add haptic feedback throughout
  - Add haptic feedback to all button presses
  - Add subtle haptic on successful actions
  - Add distinct haptic for errors
  - Use appropriate haptic intensity for each action
  - _Requirements: 4.5_

- [ ] 28.3 Apply visual brand signature
  - Add soft, faint gradient rings behind key icons (pregnancy week number, macronutrient set, page headers)
  - Make gradient rings subtle - just enough to be a brand signature
  - Use theme colors for gradient (primary to primaryLight)
  - Ensure this distinctive element is consistent across key screens
  - Test that it creates a memorable visual identity
  - _Requirements: 4.7_
