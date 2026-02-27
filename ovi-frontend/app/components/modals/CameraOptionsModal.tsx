// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface CameraOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onScanBarcode: () => void;
  onAIEstimation: () => void;
}

export const CameraOptionsModal: React.FC<CameraOptionsModalProps> = ({
  visible,
  onClose,
  onScanBarcode,
  onAIEstimation,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modal}>
              <Text style={styles.title}>Choose Scan Method</Text>
              <Text style={styles.subtitle}>
                How would you like to log your food?
              </Text>

              {/* Barcode Scanner Option */}
              <TouchableOpacity
                style={styles.option}
                onPress={onScanBarcode}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, styles.barcodeIcon]}>
                  <MaterialCommunityIcons
                    name="barcode-scan"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Scan Barcode</Text>
                  <Text style={styles.optionDescription}>
                    Scan product barcodes for instant nutrition info
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.text.muted}
                />
              </TouchableOpacity>

              {/* AI Food Estimation Option */}
              <TouchableOpacity
                style={styles.option}
                onPress={onAIEstimation}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, styles.aiIcon]}>
                  <MaterialCommunityIcons
                    name="camera-iris"
                    size={32}
                    color={theme.colors.accent}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>AI Food Estimation</Text>
                  <Text style={styles.optionDescription}>
                    Take a photo and let AI identify your food
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.text.muted}
                />
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  barcodeIcon: {
    backgroundColor: theme.colors.primaryLight,
  },
  aiIcon: {
    backgroundColor: theme.colors.accentLight,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
});
