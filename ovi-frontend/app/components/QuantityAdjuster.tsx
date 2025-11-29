import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

interface QuantityAdjusterProps {
  quantity: string;
  onQuantityChange: (value: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
}

/**
 * QuantityAdjuster Component
 * 
 * Displays quantity input with increment/decrement buttons
 */
export const QuantityAdjuster: React.FC<QuantityAdjusterProps> = ({
  quantity,
  onQuantityChange,
  onIncrement,
  onDecrement,
  min = 1,
}) => {
  const currentValue = parseFloat(quantity) || 0;
  const canDecrement = currentValue > min;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quantity</Text>
      <View style={styles.adjusterContainer}>
        <TouchableOpacity
          style={[styles.button, !canDecrement && styles.buttonDisabled]}
          onPress={onDecrement}
          disabled={!canDecrement}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
        >
          <MaterialCommunityIcons
            name="minus"
            size={24}
            color={canDecrement ? theme.colors.primary : theme.colors.text.muted}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={onQuantityChange}
          keyboardType="decimal-pad"
          accessible={true}
          accessibilityLabel="Quantity input"
          accessibilityHint="Enter the quantity of servings"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={onIncrement}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  adjusterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    backgroundColor: theme.colors.surface,
  },
});
