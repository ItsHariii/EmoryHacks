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
  const { celebrate, dismissCelebration, currentCelebration, showCelebration } =
    useCelebrations();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
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

    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
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
    ]);
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
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <SimpleDatePicker value={entryDate} onChange={setEntryDate} maximumDate={new Date()} />
        </View>

        <View style={styles.section}>
          <JournalMoodSelector
            value={mood}
            onChange={setMood}
            label="How are you feeling today?"
          />
        </View>

        <View style={styles.section}>
          <SymptomPicker value={symptoms} onChange={setSymptoms} />
        </View>

        <View style={styles.section}>
          <JournalMoodSelector
            value={sleepQuality}
            onChange={setSleepQuality}
            label="How well did you sleep?"
          />
        </View>

        <View style={styles.section}>
          <JournalMoodSelector
            value={energyLevel}
            onChange={setEnergyLevel}
            label="What's your energy level?"
          />
        </View>

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

      {/* Floating Delete + Circular Save */}
      <View style={styles.buttonContainer}>
        {isEditMode && (
          <TouchableOpacity
            style={[styles.deleteButton]}
            onPress={handleDelete}
            disabled={saving}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.saveButtonText}>✓</Text>
          )}
        </TouchableOpacity>
      </View>

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
    paddingBottom: 220, // allows space under floating button
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

  /** Floating Action Layout **/
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /** DELETE BUTTON (normal) **/
  deleteButton: {
    flex: 1,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  deleteButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },

  /** SAVE BUTTON (circular) **/
  saveButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

