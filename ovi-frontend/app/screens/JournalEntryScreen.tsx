// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { HeaderBar } from '../components/layout/HeaderBar';
import { Input } from '../components/ui/Input';
import { theme } from '../theme';
import { SimpleDatePicker } from '../components/ui/SimpleDatePicker';
import { JournalMoodSelector } from '../components/journal/JournalMoodSelector';
import { SymptomPicker } from '../components/pregnancy/SymptomPicker';
import { useToast } from '../components/ui/ToastProvider';
import { useCelebrations } from '../hooks/useCelebrations';
import { journalAPI } from '../services/api';
import { JournalEntry, JournalEntryCreate } from '../types';
import CelebrationModal from '../components/modals/CelebrationModal';

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
    <ScreenWrapper edges={['bottom']}>
      <HeaderBar
        title={isEditMode ? 'Edit Journal Entry' : 'New Journal Entry'}
        showBack
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
          <Input
            value={cravings}
            onChangeText={setCravings}
            placeholder="What are you craving today?"
            multiline
            numberOfLines={2}
            accessibilityLabel="Cravings"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes about your day..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
            accessibilityLabel="Notes"
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

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
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
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
    padding: theme.layout.screenPadding,
    paddingBottom: 220, // allows space under floating button
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  /** Floating Action Layout **/
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.layout.screenPadding,
    paddingHorizontal: theme.layout.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },

  /** DELETE BUTTON (match EditFoodEntryScreen: error color + shadow) **/
  deleteButton: {
    flex: 1,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
    minHeight: theme.layout.minTouchTarget,
    ...theme.shadows.sm,
  },
  deleteButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },

  /** SAVE BUTTON (circular, minTouchTarget for accessibility) **/
  saveButton: {
    width: Math.max(64, theme.layout.minTouchTarget + 20),
    height: Math.max(64, theme.layout.minTouchTarget + 20),
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

