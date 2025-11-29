import { useState } from 'react';
import { Alert } from 'react-native';
import { BarcodeScanningResult } from 'expo-camera';
import { lookupBarcode, isValidBarcodeFormat } from '../services/barcodeService';
import { FoodItem } from '../types';

export const useBarcodeScanner = () => {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<FoodItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);
    setLoading(true);

    try {
      // Validate barcode format
      if (!isValidBarcodeFormat(data)) {
        Alert.alert(
          'Invalid Barcode',
          'The scanned barcode format is not supported. Please try again.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        setLoading(false);
        return;
      }

      // Lookup product information
      const productData = await lookupBarcode(data);

      if (productData) {
        setProduct(productData);
        setShowConfirmModal(true);
      } else {
        setShowNotFoundModal(true);
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      Alert.alert(
        'Scan Error',
        'Failed to lookup product information. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setProduct(null);
    setShowConfirmModal(false);
    setShowNotFoundModal(false);
  };

  return {
    scanned,
    loading,
    product,
    showConfirmModal,
    showNotFoundModal,
    handleBarCodeScanned,
    resetScanner,
    setShowConfirmModal,
    setShowNotFoundModal,
  };
};
