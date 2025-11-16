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
} from 'react-native';
import { theme } from '../theme';
import { SimpleDatePicker } from '../components/SimpleDatePicker';
import { JournalMoodSelector } from '../components/JournalMoodSelector';
import { SymptomPicker } from '../components/SymptomPicker';
import { useToast } from '../components/ToastProvider';
import { useCelebrations } from '../hooks/useCelebrations';
import { journalAPI } from '../services/api';
import { JournalEntry, JournalEntryCreate } from '../types';
import CelebrationModal from '../components/CelebrationModal';

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
  const { showToast } = useToast();
  const { celebrate, dismissCelebration, currentCelebration, showCelebration } = useCelebrations();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [entryDate, setEntryDate] = useState(
    editEntry?.entry_date ? new Date(editEntry.entry_date) : new Date()
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
    return true; // Date is always set
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const entryData: JournalEntryCreate = {
        entry_date: entryDate.toISOString().split('T')[0],
        mood: mood || undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        cravings: cravings.trim() || undefined,
        sleep_quality: sleepQuality || undefined,
        energy_level: energyLevel || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditMode && editEntry) {
        await journalAPI.updateJournalEntry(editEntry.id, entryData);
        showToast('Journal entry updated successfully', 'success');
      } else {
        await journalAPI.createJournalEntry(entryData);
        showToast('Journal entry created successfully', 'success');
        
        // Celebrate first journal entry
        celebrate('first_journal_entry');
      }

      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || 'Failed to save journal entry', 'error');
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
              showToast('Journal entry deleted successfully', 'success');
              navigation.goBack();
            } catch (error: any) {
              showToast(error.message || 'Failed to delete entry', 'error');
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
        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <SimpleDatePicker
            value={entryDate}
            onChange={setEntryDate}
            maximumDate={new Date()}
          />
        </View>

        {/* Mood Selector */}
        <View style={styles.section}>
          <JournalMoodSelector 
            value={mood} 
            onChange={setMood}
            label="How are you feeling today?"
          />
        </View>

        {/* Symptom Picker */}
        <View style={styles.section}>
          <SymptomPicker value={symptoms} onChange={setSymptoms} />
        </View>

        {/* Sleep Quality Selector */}
        <View style={styles.section}>
          <JournalMoodSelector 
            value={sleepQuality} 
            onChange={setSleepQuality}
            label="How well did you sleep?"
          />
        </View>

        {/* Energy Level Selector */}
        <View style={styles.section}>
          <JournalMoodSelector 
            value={energyLevel} 
            onChange={setEnergyLevel}
            label="What's your energy level?"
          />
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
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Update' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Celebration Modal */}
      {currentCelebration && (
        <CelebrationModal
          visible={showCelebration}
          title={currentCelebration.title}
          message={currentCelebration.message}
          onDismiss={dismissCelebration}
        />
      )}
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
    color: theme.colors.text.inverse,
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
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
