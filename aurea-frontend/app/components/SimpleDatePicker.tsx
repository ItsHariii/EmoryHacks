import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';

interface SimpleDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
  value,
  onChange,
  maximumDate = new Date(),
  minimumDate,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate years based on min and max dates
  const minYear = minimumDate ? minimumDate.getFullYear() : maximumDate.getFullYear() - 10;
  const maxYear = maximumDate.getFullYear();
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  // Helper function to check if a date is within valid range
  const isDateValid = (year: number, month: number, day: number): boolean => {
    const testDate = new Date(year, month, day);
    if (minimumDate && testDate < minimumDate) return false;
    if (maximumDate && testDate > maximumDate) return false;
    return true;
  };

  // Filter months based on selected year and date constraints
  const getAvailableMonths = (): number[] => {
    const available: number[] = [];
    for (let month = 0; month < 12; month++) {
      // Check if any day in this month would be valid
      const lastDay = getDaysInMonth(selectedYear, month);
      if (isDateValid(selectedYear, month, 1) || isDateValid(selectedYear, month, lastDay)) {
        available.push(month);
      }
    }
    return available;
  };

  // Filter days based on selected year/month and date constraints
  const getAvailableDays = (): number[] => {
    const available: number[] = [];
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    for (let day = 1; day <= daysInMonth; day++) {
      if (isDateValid(selectedYear, selectedMonth, day)) {
        available.push(day);
      }
    }
    return available;
  };

  const availableMonths = getAvailableMonths();
  const availableDays = getAvailableDays();

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Validate against min/max dates
    if (minimumDate && newDate < minimumDate) {
      // If selected date is before minimum, use minimum date
      onChange(minimumDate);
    } else if (maximumDate && newDate > maximumDate) {
      // If selected date is after maximum, use maximum date
      onChange(maximumDate);
    } else {
      onChange(newDate);
    }
    
    setVisible(false);
  };

  const handleCancel = () => {
    setSelectedYear(value.getFullYear());
    setSelectedMonth(value.getMonth());
    setSelectedDay(value.getDate());
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityLabel="Select date"
        accessibilityRole="button"
      >
        <Text style={styles.triggerText}>
          {value.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>

            <View style={styles.pickerContainer}>
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.scrollView}>
                  {months.map((month, index) => {
                    const isAvailable = availableMonths.includes(index);
                    return (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.pickerItem,
                          selectedMonth === index && styles.pickerItemSelected,
                          !isAvailable && styles.pickerItemDisabled,
                        ]}
                        onPress={() => isAvailable && setSelectedMonth(index)}
                        disabled={!isAvailable}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedMonth === index && styles.pickerItemTextSelected,
                            !isAvailable && styles.pickerItemTextDisabled,
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.scrollView}>
                  {days.map((day) => {
                    const isAvailable = availableDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.pickerItem,
                          selectedDay === day && styles.pickerItemSelected,
                          !isAvailable && styles.pickerItemDisabled,
                        ]}
                        onPress={() => isAvailable && setSelectedDay(day)}
                        disabled={!isAvailable}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedDay === day && styles.pickerItemTextSelected,
                            !isAvailable && styles.pickerItemTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.scrollView}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === year && styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
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
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  icon: {
    fontSize: 20,
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
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  pickerItemTextSelected: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold,
  },
  pickerItemDisabled: {
    opacity: 0.3,
  },
  pickerItemTextDisabled: {
    color: theme.colors.text.muted,
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
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
