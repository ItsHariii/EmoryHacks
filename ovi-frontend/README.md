# Aurea Frontend - Pregnancy Nutrition & Wellness App

React Native mobile application built with Expo for pregnancy nutrition tracking and wellness monitoring.

## 📱 Features

### Core Features
- **Food Logging**: Track daily meals with comprehensive nutrition information
  - Search from USDA and Spoonacular databases
  - Barcode scanner for quick entry
  - Custom serving sizes and units
  - Meal type categorization (breakfast, lunch, dinner, snack)
  
- **Nutrition Dashboard**: Visual progress tracking
  - Daily macronutrient goals (protein, carbs, fat)
  - Micronutrient tracking (calcium, iron, folate, vitamins)
  - Weekly nutrition trends
  - Pregnancy-specific recommendations by trimester

- **Journal & Wellness Tracking**: Daily wellness monitoring
  - Mood tracking with visual indicators
  - Symptom logging (nausea, fatigue, cravings, etc.)
  - Energy level tracking
  - Sleep quality monitoring
  - Personal notes

- **Push Notifications**: Smart reminders
  - Hydration reminders (configurable intervals)
  - Supplement reminders (daily at specific times)
  - Meal logging reminders
  - Customizable notification preferences

- **Food Safety**: Pregnancy-specific guidance
  - Real-time food safety checks
  - Safety status indicators (safe, limited, avoid)
  - Detailed safety notes and recommendations
  - Ingredient analysis

### UI/UX Features
- **Smooth Animations**: Lottie animations for enhanced user experience
- **Skeleton Loading**: Professional loading states
- **Empty States**: Helpful guidance when no data exists
- **Toast Notifications**: Non-intrusive feedback
- **Responsive Design**: Optimized for various screen sizes

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Install dependencies:**
   ```bash
   cd aurea-frontend
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env` file in the root directory (optional):
   ```env
   API_BASE_URL=http://localhost:8000
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on specific platform:**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

## 📦 Dependencies

### Core
- **expo**: ~54.0.23 - Expo framework
- **react**: 19.1.0 - React library
- **react-native**: 0.81.5 - React Native framework

### Navigation
- **@react-navigation/native**: ^7.1.17 - Navigation library
- **@react-navigation/bottom-tabs**: ^7.4.7 - Bottom tab navigation
- **@react-navigation/stack**: ^7.4.8 - Stack navigation

### UI Components
- **react-native-gesture-handler**: ^2.28.0 - Gesture handling
- **react-native-safe-area-context**: ^5.6.1 - Safe area handling
- **react-native-screens**: ^4.16.0 - Native screen optimization
- **react-native-svg**: 15.12.1 - SVG support
- **lottie-react-native**: ^7.3.4 - Lottie animations
- **react-native-toast-message**: ^2.3.3 - Toast notifications

### Expo Modules
- **expo-camera**: ^17.0.9 - Camera access
- **expo-barcode-scanner**: ^13.0.1 - Barcode scanning
- **expo-notifications**: ~0.32.12 - Push notifications
- **expo-secure-store**: ~15.0.7 - Secure storage
- **expo-status-bar**: ~3.0.8 - Status bar control

### Storage & State
- **@react-native-async-storage/async-storage**: ^2.2.0 - Async storage
- **axios**: ^1.11.0 - HTTP client

### Utilities
- **@react-native-picker/picker**: ^2.11.1 - Picker component

## 📁 Project Structure

```
aurea-frontend/
├── app/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── screens/          # Screen components
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   ├── theme.ts          # Theme configuration
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, etc.
├── App.tsx               # Root component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🎨 Theme

The app uses a maroon color scheme:
- Primary: `#800000` (Maroon)
- Accent: `#A52A2A` (Burgundy)

## 🔔 Notifications

The app supports three types of notifications:
1. **Hydration Reminders**: Configurable intervals (1-4 hours)
2. **Supplement Reminders**: Daily reminders at specific times
3. **Meal Reminders**: Breakfast, lunch, and dinner reminders

### Setting up Notifications

Notifications require permissions on both iOS and Android:

**iOS**: Permissions are requested at runtime
**Android**: Configured in `app.json` with required permissions

## 🔐 Authentication

The app uses JWT token-based authentication with secure storage:
- Tokens stored in `expo-secure-store`
- Automatic token refresh on API requests
- Logout clears all stored credentials

## 🧪 Testing

```bash
# Run tests (when configured)
npm test
```

## 📱 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npm start -- --reset-cache
   ```

2. **iOS build issues:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

## 📄 License

MIT License

## 👥 Support

For support, please contact support@aurea.app
