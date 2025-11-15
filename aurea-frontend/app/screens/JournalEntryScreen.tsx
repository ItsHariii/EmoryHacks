import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import { MoodSelector } from '../components/MoodSelector';
import { SymptomPicker } from '../components/SymptomPicker';
import { journalAPI } from '../services/api';
import { JournalEntry, JournalEntryCreate } from '../types';

interface JournalEntryScreenProps {
  navigation: any;
  route: any;
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  navigation,
  route,
}) => {
  const editEntry: JournalEntry | undefined = route.params?.entry;
  const isEditMode = !!editEntry;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [entryDate, setEntryDate] = useState(
    editEntry?.entry_date || new Date().toISOString().split('T')[0]
  );
  const [mood, setMood] = useState<number | null>(editEntry?.mood || null);
  const [symptoms, setSymptoms] = useState<string[]>(editEntry?.symptoms || []);
  const [cravings, setCravings] = useState(editEntry?.cravings || '');
  const [sleepQuality, setSleepQuality] = useState<number | null>(
    editEntry?.sleep_quality || null
  );
  const [energyLevel, setEnergyLevel] = useState<number | null>(
    editEntry?.energy_level || null
  );
  const [notes, setNotes] = useState(editEntry?.notes || '');

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Journal Entry' : 'New Journal Entry',
    });
  }, [isEditMode]);

  const validateForm = (): boolean => {
    if (!entryDate) {
      Alert.alert('Validation Error', 'Please select a date');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const entryData: JournalEntryCreate = {
        entry_date: entryDate,
        mood: mood || undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        cravings: cravings.trim() || undefined,
        sleep_quality: sleepQuality || undefined,
        energy_level: energyLevel || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditMode && editEntry) {
        await journalAPI.updateJournalEntry(editEntry.id, entryData);
        Alert.alert('Success', 'Journal entry updated successfully');
      } else {
        await journalAPI.createJournalEntry(entryData);
        Alert.alert('Success', 'Journal entry created successfully');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !editEntry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await journalAPI.deleteJournalEntry(editEntry.id);
              Alert.alert('Success', 'Journal entry deleted');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete entry');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Display */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(entryDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Mood Selector */}
        <View style={styles.section}>
          <MoodSelector value={mood} onChange={setMood} />
        </View>

        {/* Symptom Picker */}
        <View style={styles.section}>
          <SymptomPicker value={symptoms} onChange={setSymptoms} />
        </View>

        {/* Sleep Quality Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sleep Quality</Text>
          <View style={styles.sliderContainer}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.sliderButton,
                  sleepQuality === value && styles.sliderButtonSelected,
                ]}
                onPress={() => setSleepQuality(value)}
                accessibilityLabel={`Sleep quality ${value} out of 5`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.sliderButtonText,
                    sleepQuality === value && styles.sliderButtonTextSelected,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Poor</Text>
            <Text style={styles.sliderLabelText}>Excellent</Text>
          </View>
        </View>

        {/* Energy Level Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Energy Level</Text>
          <View style={styles.sliderContainer}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.sliderButton,
                  energyLevel === value && styles.sliderButtonSelected,
                ]}
                onPress={() => setEnergyLevel(value)}
                accessibilityLabel={`Energy level ${value} out of 5`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.sliderButtonText,
                    energyLevel === value && styles.sliderButtonTextSelected,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Very Low</Text>
            <Text style={styles.sliderLabelText}>Very High</Text>
          </View>
        </View>

        {/* Cravings Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cravings</Text>
          <TextInput
            style={styles.input}
            value={cravings}
            onChangeText={setCravings}
            placeholder="What are you craving today?"
            placeholderTextColor={theme.colors.text.muted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Notes Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes about your day..."
            placeholderTextColor={theme.colors.text.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {isEditMode && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={saving}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.saveButton, isEditMode && styles.saveButtonHalf]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.text.light} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Update' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  dateContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sliderButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  sliderButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  sliderButtonText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.semibold,
  },
  sliderButtonTextSelected: {
    color: theme.colors.text.light,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  sliderLabelText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    minHeight: 44,
  },
  notesInput: {
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.md,
  },
  button: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: theme.colors.error,
  },
  deleteButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  saveButtonHalf: {
    flex: 1,
  },
  saveButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
