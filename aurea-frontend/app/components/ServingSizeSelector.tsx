import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface ServingSizeOption {
  label: string;
  value: string;
}

interface ServingSizeSelectorProps {
  selectedSize: string;
  onSelect: (value: string) => void;
  options?: ServingSizeOption[];
}

const DEFAULT_OPTIONS: ServingSizeOption[] = [
  { label: '1 cup', value: '1 cup' },
  { label: '1 serving', value: '1 serving' },
  { label: '100g', value: '100g' },
  { label: 'Custom', value: 'custom' },
];

/**
 * ServingSizeSelector Component
 * 
 * Displays common serving size options as selectable buttons
 */
export const ServingSizeSelector: React.FC<ServingSizeSelectorProps> = ({
  selectedSize,
  onSelect,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Serving Size</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedSize === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(option.value)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select ${option.label} serving size`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
