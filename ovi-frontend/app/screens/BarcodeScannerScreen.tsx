import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ScanningOverlay } from '../components/camera/ScanningOverlay';
import { ProductConfirmModal } from '../components/modals/ProductConfirmModal';
import { ProductNotFoundModal } from '../components/modals/ProductNotFoundModal';
import { CameraPermissionScreen } from '../components/camera/CameraPermissionScreen';
import { MealType } from '../types';
import type { FoodStackParamList } from '../types/navigation';

const LoadingOverlay: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Animated.Text style={[styles.loadingText, { opacity: pulse }]}>
          Looking up product...
        </Animated.Text>
      </View>
    </View>
  );
};

type BarcodeScannerScreenNavigationProp = StackNavigationProp<
  FoodStackParamList,
  'BarcodeScanner'
>;

type BarcodeScannerScreenRouteProp = RouteProp<FoodStackParamList, 'BarcodeScanner'>;

export const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation<BarcodeScannerScreenNavigationProp>();
  const insets = useSafeAreaInsets();
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

  // Re-check permissions when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      requestPermission();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!permission) {
      requestPermission();
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
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      />

      <ScanningOverlay />

      {/* Cancel Button */}
      <TouchableOpacity
        style={[styles.cancelButton, { top: insets.top + 10 }]}
        onPress={handleCancel}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      {/* Loading Indicator */}
      {loading && (
        <LoadingOverlay />
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
    left: theme.layout.screenPadding,
    backgroundColor: theme.colors.cameraOverlay,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  cancelButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    minWidth: 200,
    ...theme.shadows.card,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
