# Base UI Components

This directory contains reusable UI components that follow the Aurea design system with soft, warm colors and comforting interactions.

## Components

### Card
A flexible container component with soft shadows and rounded corners.

```tsx
import { Card } from './components/ui';

<Card 
  padding="lg" 
  shadow="md" 
  onPress={() => console.log('Card pressed')}
  accessibilityLabel="Nutrition summary card"
>
  <Text>Card content</Text>
</Card>
```

**Props:**
- `padding`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' (default: 'md')
- `margin`: Same as padding
- `borderRadius`: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full' (default: 'lg')
- `shadow`: 'sm' | 'md' | 'lg' (default: 'md')
- `onPress`: Optional callback for tappable cards
- `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`: Accessibility props

### Button
A button component with multiple variants, loading states, and haptic feedback.

```tsx
import { Button } from './components/ui';

<Button
  title="Log Food"
  onPress={handlePress}
  variant="primary"
  loading={isLoading}
  disabled={isDisabled}
  accessibilityHint="Opens food logging screen"
/>
```

**Props:**
- `title`: Button text (required)
- `onPress`: Callback function (required)
- `variant`: 'primary' | 'secondary' | 'outline' (default: 'primary')
- `loading`: Boolean to show loading spinner
- `disabled`: Boolean to disable button
- `accessibilityLabel`, `accessibilityHint`: Accessibility props

**Features:**
- Minimum 44x44 touch target
- Haptic feedback on press (iOS & Android)
- Loading state with spinner
- Disabled state with reduced opacity

### Input
A text input component with validation states and helper text.

```tsx
import { Input } from './components/ui';

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  validationState="error"
  errorMessage="Please enter a valid email"
  helperText="We'll never share your email"
  accessibilityHint="Enter your email address"
/>
```

**Props:**
- All standard TextInput props
- `label`: Optional label text
- `helperText`: Optional helper text below input
- `errorMessage`: Error message to display
- `validationState`: 'default' | 'error' | 'success' (default: 'default')
- `accessibilityLabel`, `accessibilityHint`: Accessibility props

**Features:**
- Color-coded borders (default, error, success)
- Error message display
- Helper text support
- Minimum 44px height

### LoadingSpinner
An animated loading indicator with encouraging messages.

```tsx
import { LoadingSpinner } from './components/ui';

<LoadingSpinner
  message="Preparing your nutrition data..."
  size="large"
  color={theme.colors.primary}
/>
```

**Props:**
- `message`: Optional loading message (default: "Preparing your nutrition data...")
- `size`: 'small' | 'large' (default: 'large')
- `color`: Spinner color (default: theme.colors.primary)

### Toast
A notification component with auto-dismiss and swipe gesture support.

```tsx
import { Toast } from './components/ui';

<Toast
  visible={showToast}
  message="Food logged successfully!"
  variant="success"
  duration={3000}
  onDismiss={() => setShowToast(false)}
/>
```

**Props:**
- `visible`: Boolean to show/hide toast
- `message`: Toast message text
- `variant`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `duration`: Auto-dismiss duration in ms (default: 3000)
- `onDismiss`: Callback when toast is dismissed

**Features:**
- Slide-in animation from top
- Auto-dismiss after duration
- Swipe up or sideways to dismiss manually
- Color-coded by variant
- Icon indicators

### ToastProvider & useToast
Context provider and hook for easier toast management.

```tsx
// Wrap your app with ToastProvider
import { ToastProvider } from './components/ui';

<ToastProvider>
  <App />
</ToastProvider>

// Use the hook in any component
import { useToast } from './components/ui';

function MyComponent() {
  const { showToast } = useToast();
  
  const handleSuccess = () => {
    showToast('Food logged successfully!', 'success', 3000);
  };
  
  return <Button title="Log Food" onPress={handleSuccess} />;
}
```

## Design System

All components follow the Aurea design system defined in `app/theme.ts`:

- **Colors**: Soft, warm palette (rose pink, sky blue, warm cream)
- **Spacing**: 4px, 8px, 16px, 24px, 32px, 48px
- **Border Radius**: 4px, 8px, 12px, 16px, 24px
- **Shadows**: sm, md, lg elevation levels
- **Typography**: System font with defined sizes and weights
- **Animations**: 200ms (fast), 300ms (normal), 400ms (slow)

## Accessibility

All components include:
- Proper accessibility roles
- Accessibility labels and hints
- Minimum 44x44 touch targets
- Color contrast compliance
- Screen reader support
- Live region announcements for dynamic content

## Installation Note

The Button component uses `expo-haptics` for haptic feedback. If not already installed, run:

```bash
npx expo install expo-haptics
```

The component will gracefully handle the absence of haptics if not installed.
