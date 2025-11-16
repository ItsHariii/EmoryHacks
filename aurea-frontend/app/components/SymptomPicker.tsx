import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';

interface SymptomPickerProps {
  value: string[];
  onChange: (symptoms: string[]) => void;
}

const PREDEFINED_SYMPTOMS = [
  'Nausea',
  'Fatigue',
  'Headache',
  'Back Pain',
  'Swelling',
  'Heartburn',
  'Constipation',
  'Insomnia',
  'Dizziness',
  'Leg Cramps',
];

export const SymptomPicker: React.FC<SymptomPickerProps> = ({ value, onChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');

  const toggleSymptom = (symptom: string) => {
    if (value.includes(symptom)) {
      onChange(value.filter((s) => s !== symptom));
    } else {
      onChange([...value, symptom]);
    }
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !value.includes(customSymptom.trim())) {
      onChange([...value, customSymptom.trim()]);
      setCustomSymptom('');
      setShowModal(false);
    }
  };

  const removeSymptom = (symptom: string) => {
    onChange(value.filter((s) => s !== symptom));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Any symptoms today?</Text>
      
      {/* Selected symptoms */}
      {value.length > 0 && (
        <View style={styles.selectedContainer}>
          {value.map((symptom) => (
            <TouchableOpacity
              key={symptom}
              style={styles.selectedChip}
              onPress={() => removeSymptom(symptom)}
              accessibilityLabel={`Remove ${symptom}`}
              accessibilityRole="button"
            >
              <Text style={styles.selectedChipText}>{symptom}</Text>
              <Text style={styles.removeIcon}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Predefined symptoms grid */}
      <View style={styles.symptomsGrid}>
        {PREDEFINED_SYMPTOMS.map((symptom) => (
          <TouchableOpacity
            key={symptom}
            style={[
              styles.symptomButton,
              value.includes(symptom) && styles.symptomButtonSelected,
            ]}
            onPress={() => toggleSymptom(symptom)}
            accessibilityLabel={`${symptom} ${value.includes(symptom) ? 'selected' : ''}`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.symptomText,
                value.includes(symptom) && styles.symptomTextSelected,
              ]}
            >
              {symptom}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Add custom button */}
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowModal(true)}
          accessibilityLabel="Add custom symptom"
          accessibilityRole="button"
        >
          <Text style={styles.addCustomText}>+ Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Custom symptom modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Symptom</Text>
            <TextInput
              style={styles.input}
              value={customSymptom}
              onChangeText={setCustomSymptom}
              placeholder="Enter symptom name"
              placeholderTextColor={theme.colors.text.muted}
              autoFocus
              onSubmitEditing={addCustomSymptom}
              accessible={true}
              accessibilityLabel="Custom symptom name"
              accessibilityHint="Enter a custom symptom not in the predefined list"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCustomSymptom('');
                  setShowModal(false);
                }}
                accessible={true}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
                accessibilityHint="Close modal without adding symptom"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addCustomSymptom}
                disabled={!customSymptom.trim()}
                accessible={true}
                accessibilityLabel="Add symptom"
                accessibilityRole="button"
                accessibilityHint="Add the custom symptom to your list"
                accessibilityState={{ disabled: !customSymptom.trim() }}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  selectedChipText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  removeIcon: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  symptomButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    minHeight: 44,
    justifyContent: 'center',
  },
  symptomButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  symptomText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  symptomTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  addCustomButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.background,
    minHeight: 44,
    justifyContent: 'center',
  },
  addCustomText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
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
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    minHeight: 44,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
