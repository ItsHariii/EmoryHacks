// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ScanningOverlay } from '../components/camera/ScanningOverlay';
import { ProductNotFoundModal } from '../components/modals/ProductNotFoundModal';
import { CameraPermissionScreen } from '../components/camera/CameraPermissionScreen';
import { MealType } from '../types';
import type { FoodStackParamList } from '../types/navigation';

type BarcodeScannerScreenNavigationProp = StackNavigationProp<FoodStackParamList, 'BarcodeScanner'>;
type BarcodeScannerScreenRouteProp = RouteProp<FoodStackParamList, 'BarcodeScanner'>;

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
      <View style={styles.loadingPill}>
        <ActivityIndicator size="small" color="#B84C3F" />
        <Animated.Text style={[styles.loadingText, { opacity: pulse }]}>
          Looking up product…
        </Animated.Text>
      </View>
    </View>
  );
};

const ResultSheet: React.FC<{
  product: any;
  mealType: MealType;
  onAdd: () => void;
  onDismiss: () => void;
}> = ({ product, mealType, onAdd, onDismiss }) => {
  const kcal = Math.round(product?.calories_per_100g || 0);
  const macros = [
    { l: 'P', v: Math.round(product?.protein_per_100g || 0) },
    { l: 'C', v: Math.round(product?.carbs_per_100g || 0) },
    { l: 'F', v: Math.round(product?.fat_per_100g || 0) },
  ];
  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetKicker}>FOUND</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} accessibilityLabel="Dismiss">
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.foodName} numberOfLines={2}>
        {product?.name?.split(',')[0] || product?.name || 'Unknown product'}
        {product?.brand ? <Text style={styles.foodBrand}>  ·  {product.brand}</Text> : null}
      </Text>

      <View style={styles.kcalRow}>
        <Text style={styles.kcalValue}>{kcal}</Text>
        <Text style={styles.kcalUnit}>kcal per 100g</Text>
      </View>

      <View style={styles.macroRow}>
        {macros.map((m, i) => (
          <View key={m.l} style={[styles.macroItem, i < macros.length - 1 && styles.macroDivider]}>
            <Text style={styles.macroValue}>{m.v}<Text style={styles.macroValueG}>g</Text></Text>
            <Text style={styles.macroLabel}>{m.l}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.cta} onPress={onAdd} activeOpacity={0.9}>
        <Text style={styles.ctaText}>
          Add to <Text style={styles.ctaTextItalic}>{mealLabel}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation<BarcodeScannerScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const route = useRoute<BarcodeScannerScreenRouteProp>();
  const mealType = (route.params?.mealType || 'snack') as MealType;

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
    const unsubscribe = navigation.addListener('focus', () => requestPermission());
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleConfirmProduct = () => {
    setShowConfirmModal(false);
    if (product) {
      (navigation as any).navigate('SearchFood', { mealType, preselectedFood: product });
    }
  };
  const handleDismissResult = () => {
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
  const handleCancel = () => navigation.goBack();

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

      <ScanningOverlay instruction="Align the barcode within the frame" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelHit} accessibilityLabel="Cancel">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topKicker}>SCAN BARCODE</Text>
        <View style={{ width: 56 }} />
      </View>

      {loading && <LoadingOverlay />}

      {/* Result sheet */}
      {showConfirmModal && product && (
        <ResultSheet
          product={product}
          mealType={mealType}
          onAdd={handleConfirmProduct}
          onDismiss={handleDismissResult}
        />
      )}

      {/* Not found modal */}
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
    backgroundColor: '#0F0C09',
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cancelHit: {
    paddingVertical: 8,
    minWidth: 56,
  },
  cancelText: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#F6F1EA',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  topKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: 'rgba(246,241,234,0.7)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: '#F6F1EA',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: '#2B221B',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#F6F1EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E0D5',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.4,
  },
  dismissBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 24,
    color: '#8C7E70',
    lineHeight: 26,
  },
  foodName: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    color: '#2B221B',
    letterSpacing: -0.4,
    lineHeight: 26,
    marginTop: 4,
  },
  foodBrand: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: '#8C7E70',
  },
  kcalRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  kcalValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 40,
    color: '#2B221B',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  kcalUnit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
  },
  macroRow: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: '#FCF8F1',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    paddingVertical: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroDivider: {
    borderRightWidth: 0.5,
    borderRightColor: '#E8E0D5',
  },
  macroValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
  },
  macroValueG: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
  },
  macroLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#8C7E70',
    letterSpacing: 1,
    marginTop: 2,
  },
  cta: {
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaTextItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
});
