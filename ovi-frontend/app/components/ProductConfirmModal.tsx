import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
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
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  productInfo: {
    marginBottom: theme.spacing.lg,
  },
  productName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  productBrand: {
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
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  nutritionText: {
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
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelModalButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  safetyNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
