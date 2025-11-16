import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../theme';

interface ServingSizeInputProps {
  value: string; // e.g., "100g", "1 cup"
  onChange: (value: string) => void;
}

const UNITS = [
  { label: 'Grams (g)', value: 'g', defaultAmount: '100' },
  { label: 'Milligrams (mg)', value: 'mg', defaultAmount: '1000' },
  { label: 'Ounces (oz)', value: 'oz', defaultAmount: '3.5' },
  { label: 'Cups', value: 'cup', defaultAmount: '1' },
  { label: 'Tablespoons (tbsp)', value: 'tbsp', defaultAmount: '1' },
  { label: 'Teaspoons (tsp)', value: 'tsp', defaultAmount: '1' },
  { label: 'Milliliters (ml)', value: 'ml', defaultAmount: '100' },
  { label: 'Servings', value: 'serving', defaultAmount: '1' },
];

/**
 * ServingSizeInput Component
 * 
 * Clean serving size input with unit dropdown and numeric field
 */
export const ServingSizeInput: React.FC<ServingSizeInputProps> = ({ value, onChange }) => {
  // Parse current value into amount and unit
  const parseValue = (val: string): { amount: string; unit: string } => {
    const match = val.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      return { amount: match[1], unit: match[2] || 'g' };
    }
    return { amount: '100', unit: 'g' };
  };

  const { amount: initialAmount, unit: initialUnit } = parseValue(value);
  const [amount, setAmount] = useState(initialAmount);
  const [unit, setUnit] = useState(initialUnit);

  const handleAmountChange = (newAmount: string) => {
    // Only allow numbers and decimal point
    const cleaned = newAmount.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    onChange(`${cleaned}${unit}`);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    
    // If amount is empty or zero, set smart default
    if (!amount || parseFloat(amount) === 0) {
      const unitConfig = UNITS.find(u => u.value === newUnit);
      const defaultAmount = unitConfig?.defaultAmount || '1';
      setAmount(defaultAmount);
      onChange(`${defaultAmount}${newUnit}`);
    } else {
      onChange(`${amount}${newUnit}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Serving Size</Text>
      
      <View style={styles.inputRow}>
        {/* Numeric Input */}
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.text.muted}
          />
        </View>

        {/* Unit Dropdown */}
        <View style={styles.unitContainer}>
          <Picker
            selectedValue={unit}
            onValueChange={handleUnitChange}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {UNITS.map((u) => (
              <Picker.Item key={u.value} label={u.label} value={u.value} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Preview */}
      <Text style={styles.preview}>
        {amount && parseFloat(amount) > 0 ? `${amount} ${unit}` : 'Enter amount'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  amountContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  amountInput: {
    padding: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  unitContainer: {
    flex: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  preview: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
