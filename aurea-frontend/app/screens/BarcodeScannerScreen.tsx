import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../theme';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ScanningOverlay } from '../components/ScanningOverlay';
import { ProductConfirmModal } from '../components/ProductConfirmModal';
import { ProductNotFoundModal } from '../components/ProductNotFoundModal';
import { CameraPermissionScreen } from '../components/CameraPermissionScreen';
import { MealType } from '../types';

type BarcodeScannerScreenRouteProp = RouteProp<
  { BarcodeScannerScreen: { mealType?: MealType } },
  'BarcodeScannerScreen'
>;

export const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BarcodeScannerScreenRouteProp>();
  const mealType = route.params?.mealType || 'snack';

  const [permission, requestPermission] = useCameraPermissions();
  
  const {
    scanned,
    loading,
    product,
    showConfirmModal,
    showNotFoundModal,
    handleBarCodeScanned,
    resetScanner,
    setShowConfirmModal,
    setShowNotFoundModal,
  } = useBarcodeScanner();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    } else if (!permission.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to scan barcodes.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Request Again', onPress: requestPermission },
        ]
      );
    }
  }, [permission]);

  const handleConfirmProduct = () => {
    setShowConfirmModal(false);
    if (product) {
      (navigation as any).navigate('SearchFood', {
        mealType,
        preselectedFood: product,
      });
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    resetScanner();
  };

  const handleManualEntry = () => {
    setShowNotFoundModal(false);
    (navigation as any).navigate('SearchFood', { mealType });
  };

  const handleTryAgain = () => {
    setShowNotFoundModal(false);
    resetScanner();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Show permission screens
  if (!permission) {
    return <CameraPermissionScreen loading onRequestPermission={requestPermission} onGoBack={handleCancel} />;
  }

  if (!permission.granted) {
    return <CameraPermissionScreen denied onRequestPermission={requestPermission} onGoBack={handleCancel} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <ScanningOverlay />

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Looking up product...</Text>
          </View>
        </View>
      )}

      {/* Product Confirmation Modal */}
      <ProductConfirmModal
        visible={showConfirmModal}
        product={product}
        onConfirm={handleConfirmProduct}
        onCancel={handleCancelConfirm}
      />

      {/* Product Not Found Modal */}
      <ProductNotFoundModal
        visible={showNotFoundModal}
        onTryAgain={handleTryAgain}
        onManualEntry={handleManualEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cancelButton: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.lg,
    backgroundColor: 'rgba(128, 0, 0, 0.8)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  cancelButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
});
