// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '../../theme';

interface SimpleTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({
  value,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);
  const initialHour = value.getHours();
  const [selectedHour12, setSelectedHour12] = useState(initialHour % 12 === 0 ? 12 : initialHour % 12);
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialHour >= 12 ? 'PM' : 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  const formatLabel = () => {
    const h = value.getHours();
    const m = value.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleConfirm = () => {
    let hour24 = selectedHour12 % 12;
    if (selectedPeriod === 'PM') hour24 += 12;
    const next = new Date(value);
    next.setHours(hour24);
    next.setMinutes(selectedMinute);
    next.setSeconds(0);
    next.setMilliseconds(0);
    onChange(next);
    setVisible(false);
  };

  const handleCancel = () => {
    const h = value.getHours();
    setSelectedHour12(h % 12 === 0 ? 12 : h % 12);
    setSelectedMinute(value.getMinutes());
    setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityLabel="Select time"
        accessibilityRole="button"
      >
        <Text style={styles.triggerText}>{formatLabel()}</Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.scrollView}>
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, selectedHour12 === h && styles.pickerItemSelected]}
                      onPress={() => setSelectedHour12(h)}
                    >
                      <Text style={[styles.pickerItemText, selectedHour12 === h && styles.pickerItemTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView style={styles.scrollView}>
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, selectedMinute === m && styles.pickerItemSelected]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, selectedMinute === m && styles.pickerItemTextSelected]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>AM/PM</Text>
                <ScrollView style={styles.scrollView}>
                  {periods.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pickerItem, selectedPeriod === p && styles.pickerItemSelected]}
                      onPress={() => setSelectedPeriod(p)}
                    >
                      <Text style={[styles.pickerItemText, selectedPeriod === p && styles.pickerItemTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
  },
  triggerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  icon: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 18,
    marginLeft: theme.spacing.sm,
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
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  pickerItem: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  pickerItemText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  pickerItemTextSelected: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
