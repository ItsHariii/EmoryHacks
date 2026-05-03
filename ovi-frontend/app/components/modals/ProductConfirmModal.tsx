// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { FoodItem } from '../types';

interface ProductConfirmModalProps {
  visible: boolean;
  product: FoodItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ProductConfirmModal: React.FC<ProductConfirmModalProps> = ({
  visible,
  product,
  onConfirm,
  onCancel,
}) => {
  if (!product) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Product Found!</Text>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && (
              <Text style={styles.productBrand}>{product.brand}</Text>
            )}

            {/* Pregnancy Safety Rating */}
            {product.safety_status && (
              <View style={[
                styles.safetyBadge,
                product.safety_status === 'safe' && styles.safetyBadgeSafe,
                product.safety_status === 'caution' && styles.safetyBadgeCaution,
                product.safety_status === 'avoid' && styles.safetyBadgeAvoid,
              ]}>
                <Text style={styles.safetyBadgeText}>
                  {product.safety_status === 'safe' && '✓ Safe During Pregnancy'}
                  {product.safety_status === 'caution' && '⚠️ Use Caution'}
                  {product.safety_status === 'avoid' && '⛔ Avoid During Pregnancy'}
                </Text>
                {product.safety_notes && (
                  <Text style={styles.safetyNotes}>{product.safety_notes}</Text>
                )}
              </View>
            )}

            <View style={styles.nutritionInfo}>
              <Text style={styles.nutritionLabel}>Nutrition per 100g:</Text>
              <Text style={styles.nutritionText}>
                Calories: {product.calories_per_100g} kcal
              </Text>
              <Text style={styles.nutritionText}>
                Protein: {product.protein_per_100g?.toFixed(1) || 0}g
              </Text>
              <Text style={styles.nutritionText}>
                Carbs: {product.carbs_per_100g?.toFixed(1) || 0}g
              </Text>
              <Text style={styles.nutritionText}>
                Fat: {product.fat_per_100g?.toFixed(1) || 0}g
              </Text>
              {product.fiber_per_100g !== undefined && (
                <Text style={styles.nutritionText}>
                  Fiber: {product.fiber_per_100g.toFixed(1)}g
                </Text>
              )}
              {product.sugar_per_100g !== undefined && (
                <Text style={styles.nutritionText}>
                  Sugar: {product.sugar_per_100g.toFixed(1)}g
                </Text>
              )}
              {product.sodium_per_100g !== undefined && (
                <Text style={styles.nutritionText}>
                  Sodium: {(product.sodium_per_100g * 1000).toFixed(0)}mg
                </Text>
              )}
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Add to Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    color: '#2B221B',
    letterSpacing: -0.4,
    marginBottom: 16,
    textAlign: 'center',
  },
  productInfo: {
    marginBottom: theme.spacing.lg,
  },
  productName: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  productBrand: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  nutritionInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  nutritionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  nutritionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  cancelModalButtonText: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#2B221B',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#2B221B',
  },
  confirmButtonText: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  safetyBadge: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
  },
  safetyBadgeSafe: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  safetyBadgeCaution: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  safetyBadgeAvoid: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  safetyBadgeText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  safetyNotes: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
