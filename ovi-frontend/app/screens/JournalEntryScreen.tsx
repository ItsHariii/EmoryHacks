// @ts-nocheck
import React, { useState } from 'react';
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
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../theme';
import { SimpleDatePicker } from '../components/ui/SimpleDatePicker';
import { useToast } from '../components/ui/ToastProvider';
import { useCelebrations } from '../hooks/useCelebrations';
import { journalAPI } from '../services/api';
import { JournalEntry, JournalEntryCreate } from '../types';
import CelebrationModal from '../components/modals/CelebrationModal';

const MOOD_OPTIONS = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Off' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const COMMON_SYMPTOMS = [
  'Nausea', 'Fatigue', 'Back pain', 'Heartburn', 'Cravings',
  'Headache', 'Swelling', 'Insomnia', 'Cramps', 'Mood swings',
];

interface JournalEntryScreenProps {
  navigation: any;
  route: any;
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({ navigation, route }) => {
  const editEntry: JournalEntry | undefined = route.params?.entry;
  const initialMood: number | undefined = route.params?.initialMood;
  const isEditMode = !!editEntry;
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { celebrate, dismissCelebration, currentCelebration, showCelebration } = useCelebrations();

  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(
    editEntry?.entry_date ? new Date(editEntry.entry_date) : new Date()
  );
  const [mood, setMood] = useState<number | null>(editEntry?.mood ?? initialMood ?? null);
  const [symptoms, setSymptoms] = useState<string[]>(editEntry?.symptoms || []);
  const [sleepQuality, setSleepQuality] = useState<number | null>(editEntry?.sleep_quality || null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(editEntry?.energy_level || null);
  const [notes, setNotes] = useState(editEntry?.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entryData: JournalEntryCreate = {
        entry_date: entryDate.toISOString().split('T')[0],
        mood: mood || undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        sleep_quality: sleepQuality || undefined,
        energy_level: energyLevel || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditMode && editEntry) {
        await journalAPI.updateJournalEntry(editEntry.id, entryData);
        showToast('Entry updated', 'success');
      } else {
        await journalAPI.createJournalEntry(entryData);
        showToast('Entry saved', 'success');
        celebrate('first_journal_entry');
      }
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || 'Failed to save entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !editEntry) return;
    Alert.alert('Delete entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await journalAPI.deleteJournalEntry(editEntry.id);
            showToast('Entry deleted', 'success');
            navigation.goBack();
          } catch (error: any) {
            showToast(error.message || 'Failed to delete', 'error');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const dateLabel = entryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      {/* Top nav */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color="#2B221B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker((v) => !v)} style={styles.dateChip}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={14} color="#2B221B" />
          <Text style={styles.dateChipText}>{dateLabel}</Text>
        </TouchableOpacity>
        {isEditMode ? (
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} accessibilityLabel="Delete">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#B84C3F" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40, height: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 180 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.pageTitle}>
            How are <Text style={styles.pageTitleItalic}>you</Text>
            <Text style={styles.pageTitleDot}>?</Text>
          </Text>

          {showDatePicker && (
            <View style={{ marginBottom: 22 }}>
              <SimpleDatePicker value={entryDate} onChange={setEntryDate} maximumDate={new Date()} />
            </View>
          )}

          {/* Mood */}
          <Text style={styles.sectionLabel}>Mood</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((opt) => {
              const selected = mood === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMood(opt.value)}
                  style={[styles.moodChip, selected && styles.moodChipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.moodChipText, selected && styles.moodChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Symptoms */}
          <Text style={styles.sectionLabel}>Symptoms</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.symptomScroll}
            style={styles.symptomScrollWrap}
          >
            {COMMON_SYMPTOMS.map((s) => {
              const selected = symptoms.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleSymptom(s)}
                  style={[styles.symptomChip, selected && styles.symptomChipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.symptomChipText, selected && styles.symptomChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes</Text>
          <View style={styles.notesWrap}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write what's on your mind…"
              placeholderTextColor="#8C7E70"
              multiline
              style={styles.notesInput}
              accessibilityLabel="Notes"
            />
          </View>

          {/* Sleep */}
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>Sleep</Text>
            <Text style={styles.sectionHint}>· out of 5</Text>
          </View>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = sleepQuality === n;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setSleepQuality(n)}
                  style={[styles.scaleDot, selected && styles.scaleDotActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.scaleNum, selected && styles.scaleNumActive]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Energy */}
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>Energy</Text>
            <Text style={styles.sectionHint}>· out of 5</Text>
          </View>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = energyLevel === n;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setEnergyLevel(n)}
                  style={[styles.scaleDot, selected && styles.scaleDotActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.scaleNum, selected && styles.scaleNumActive]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.ctaWrap, { bottom: insets.bottom + 82 }]}>
        <TouchableOpacity
          style={styles.cta}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>{isEditMode ? 'Save changes' : 'Save entry'}</Text>
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
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCF8F1',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#EFE7DC',
  },
  dateChipText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 12,
    color: '#2B221B',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  pageTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: '#2B221B',
    letterSpacing: -0.8,
    lineHeight: 32,
    marginTop: 4,
    marginBottom: 22,
  },
  pageTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  pageTitleDot: {
    color: '#B84C3F',
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 22,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 22,
  },
  sectionHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
  },
  moodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  moodChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F6F1EA',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  moodChipActive: {
    backgroundColor: '#2B221B',
    borderColor: '#2B221B',
  },
  moodChipText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 12,
    color: '#2B221B',
  },
  moodChipTextActive: {
    color: '#FFFFFF',
  },
  symptomScrollWrap: {
    marginHorizontal: -20,
  },
  symptomScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FCF8F1',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  symptomChipActive: {
    backgroundColor: '#B84C3F',
    borderColor: '#B84C3F',
  },
  symptomChipText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 12,
    color: '#2B221B',
    letterSpacing: 0.2,
  },
  symptomChipTextActive: {
    color: '#FDFAF6',
  },
  notesWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    paddingBottom: 6,
  },
  notesInput: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    color: '#2B221B',
    paddingVertical: 8,
    minHeight: 96,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scaleDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCF8F1',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotActive: {
    backgroundColor: '#2B221B',
    borderColor: '#2B221B',
  },
  scaleNum: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    color: '#2B221B',
  },
  scaleNumActive: {
    color: '#FFFFFF',
  },
  ctaWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
