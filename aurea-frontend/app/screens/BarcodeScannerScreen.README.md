# Barcode Scanner Module Structure

This document describes the modular architecture of the Barcode Scanner feature.

## File Structure

```
app/
├── hooks/
│   └── useBarcodeScanner.ts          # Custom hook for scanning logic
├── components/
│   ├── ScanningOverlay.tsx           # Camera overlay with scan frame
│   ├── ProductConfirmModal.tsx       # Modal for confirming found products
│   ├── ProductNotFoundModal.tsx      # Modal for product not found
│   └── CameraPermissionScreen.tsx    # Permission request/denied screens
├── screens/
│   └── BarcodeScannerScreen.tsx      # Main screen orchestrator
└── services/
    └── barcodeService.ts             # API integration service

```

## Module Responsibilities

### 1. **useBarcodeScanner Hook** (`hooks/useBarcodeScanner.ts`)
**Purpose**: Manages all barcode scanning state and logic
- Handles barcode scan events
- Validates barcode formats
- Looks up product information via API
- Manages modal visibility states
- Provides reset functionality

**Exports**:
- `scanned`: Boolean indicating if a barcode was scanned
- `loading`: Boolean for API loading state
- `product`: FoodItem or null
- `showConfirmModal`: Boolean for product confirmation modal
- `showNotFoundModal`: Boolean for not found modal
- `handleBarCodeScanned`: Function to process scanned barcodes
- `resetScanner`: Function to reset all states
- `setShowConfirmModal`: Function to control confirm modal
- `setShowNotFoundModal`: Function to control not found modal

### 2. **ScanningOverlay Component** (`components/ScanningOverlay.tsx`)
**Purpose**: Renders the camera overlay with scanning frame
- Displays darkened overlay around scan area
- Shows corner markers for scan frame
- Displays instruction text
- Pure presentational component (no logic)

### 3. **ProductConfirmModal Component** (`components/ProductConfirmModal.tsx`)
**Purpose**: Shows product details and confirmation options
- Displays product name, brand, and nutrition info
- Provides "Add to Log" and "Cancel" actions
- Reusable modal component

**Props**:
- `visible`: Boolean to show/hide modal
- `product`: FoodItem to display
- `onConfirm`: Callback when user confirms
- `onCancel`: Callback when user cancels

### 4. **ProductNotFoundModal Component** (`components/ProductNotFoundModal.tsx`)
**Purpose**: Handles product not found scenario
- Informs user product wasn't found
- Provides "Try Again" and "Manual Entry" options
- Reusable modal component

**Props**:
- `visible`: Boolean to show/hide modal
- `onTryAgain`: Callback to scan again
- `onManualEntry`: Callback to enter manually

### 5. **CameraPermissionScreen Component** (`components/CameraPermissionScreen.tsx`)
**Purpose**: Handles camera permission states
- Shows loading state while requesting permission
- Shows denied state with action buttons
- Provides "Request Permission" and "Go Back" actions

**Props**:
- `loading`: Boolean for loading state
- `denied`: Boolean for denied state
- `onRequestPermission`: Callback to request permission
- `onGoBack`: Callback to navigate back

### 6. **BarcodeScannerScreen** (`screens/BarcodeScannerScreen.tsx`)
**Purpose**: Main orchestrator that combines all modules
- Manages camera permissions
- Renders CameraView
- Coordinates between hook and components
- Handles navigation

**Responsibilities**:
- Permission management
- Navigation logic
- Component composition
- Event coordination

## Benefits of This Structure

### 1. **Separation of Concerns**
- Logic (hook) is separate from UI (components)
- Each component has a single responsibility
- Easy to understand what each file does

### 2. **Reusability**
- Components can be reused in other screens
- Hook can be used in different contexts
- Modals are self-contained

### 3. **Testability**
- Hook logic can be tested independently
- Components can be tested in isolation
- Easy to mock dependencies

### 4. **Maintainability**
- Bugs are easier to locate
- Changes are localized to specific files
- Clear file structure

### 5. **Scalability**
- Easy to add new features
- Can extend components without affecting others
- Clear patterns to follow

## Usage Example

```typescript
// In any screen that needs barcode scanning
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ProductConfirmModal } from '../components/ProductConfirmModal';

const MyScreen = () => {
  const {
    product,
    showConfirmModal,
    handleBarCodeScanned,
    setShowConfirmModal,
  } = useBarcodeScanner();

  return (
    <>
      <CameraView onBarcodeScanned={handleBarCodeScanned} />
      <ProductConfirmModal
        visible={showConfirmModal}
        product={product}
        onConfirm={() => {/* handle */}}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};
```

## Future Enhancements

Potential improvements with this modular structure:
1. Add unit tests for the hook
2. Add snapshot tests for components
3. Extract styles to a separate theme file
4. Add analytics tracking in the hook
5. Support additional barcode formats
6. Add barcode history tracking
7. Implement offline caching in the hook
