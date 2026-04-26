// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { SimpleDatePicker } from '../components/ui/SimpleDatePicker';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { JournalListSkeleton } from '../components/skeletons';
import { useToast } from '../components/ui/ToastProvider';
import { theme } from '../theme';
import { journalAPI } from '../services/api';
import { JournalEntry } from '../types';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

interface JournalScreenProps {
  navigation: any;
}

const MOOD_DOTS = ['', '○', '◔', '◑', '◕', '●'];
const MOOD_LABELS = ['', 'Rough', 'Off', 'Okay', 'Good', 'Great'];

export const JournalScreen: React.FC<JournalScreenProps> = ({ navigation }) => {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<number | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadEntries = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;
      const data = await journalAPI.getJournalEntries(startDateStr, endDateStr);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err.message || 'Could not load journal entries';
      setError(message);
      setEntries([]);
      showToast(message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
    const unsubscribe = navigation.addListener('focus', () => loadEntries());
    return unsubscribe;
  }, [navigation, startDate, endDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries(true);
  }, []);

  const handleCreateEntry = () => {
    Alert.alert(
      'Create Journal Entry',
      'How would you like to create your entry?',
      [
        { text: 'Chat with Ovi', onPress: () => navigation.navigate('ChatJournal') },
        { text: 'Traditional Form', onPress: () => navigation.navigate('JournalEntry') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMoodSelect = (mood: number) => {
    setActiveMood(mood);
    navigation.navigate('JournalEntry', { initialMood: mood });
  };

  const handleEditEntry = (entry: JournalEntry) => {
    navigation.navigate('JournalEntry', { entry });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
    });
  };

  const formatFullDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).replace(',', ' ·');

  const renderHeader = () => (
    <View>
      {/* Greeting Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Wellness Journal</Text>
          <Text style={styles.title}>
            How are <Text style={styles.titleItalic}>you</Text>
            <Text style={styles.titleDot}>?</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowFilterModal(true)}
            accessibilityLabel="Filter entries"
          >
            <MaterialCommunityIcons name="tune-variant" size={18} color="#2B221B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleCreateEntry}
            accessibilityLabel="Create entry"
          >
            <MaterialCommunityIcons name="plus" size={20} color="#2B221B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mood check-in card */}
      <View style={styles.checkInCard}>
        <Text style={styles.checkInKicker}>Check-in</Text>
        <Text style={styles.checkInPrompt}>How are you feeling today?</Text>
        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map(i => {
            const selected = activeMood === i;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleMoodSelect(i)}
                style={[styles.moodTile, selected && styles.moodTileActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.moodGlyph, selected && styles.moodGlyphActive]}>
                  {MOOD_DOTS[i]}
                </Text>
                <Text style={[styles.moodLabel, selected && styles.moodLabelActive]}>
                  {MOOD_LABELS[i]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 22, marginBottom: 10 }}>
        <Text style={styles.sectionLabel}>Past Entries</Text>
      </View>
    </View>
  );

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const moodGlyph = item.mood ? MOOD_DOTS[item.mood] : '';
    const moodLabel = item.mood ? MOOD_LABELS[item.mood] : '';
    const moodPositive = (item.mood ?? 0) >= 4;
    const notes = item.notes || '';
    const snippet = notes.length > 140 ? notes.substring(0, 140) + '…' : notes;

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => handleEditEntry(item)}
        accessibilityLabel={`Journal entry for ${formatDate(item.entry_date)}`}
        accessibilityRole="button"
      >
        <View style={styles.entryHeader}>
          <View>
            <Text style={styles.entryDate}>{formatDate(item.entry_date)}</Text>
            <Text style={styles.entryFullDate}>{formatFullDate(item.entry_date)}</Text>
          </View>
          {moodGlyph ? (
            <View style={styles.entryMoodWrap}>
              <View style={[
                styles.entryMoodDot,
                { backgroundColor: moodPositive ? '#E9EEE2' : '#F4E4DF' },
              ]}>
                <Text style={{
                  fontSize: 13,
                  color: moodPositive ? '#4F6148' : '#8F3A31',
                }}>{moodGlyph}</Text>
              </View>
              <Text style={styles.entryMoodLabel}>{moodLabel}</Text>
            </View>
          ) : null}
        </View>

        {snippet ? (
          <Text style={styles.entryQuote}>"{snippet}"</Text>
        ) : null}

        <View style={styles.entryFooter}>
          <View style={styles.symptomsWrap}>
            {(item.symptoms || []).slice(0, 2).map((s, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={styles.metricsWrap}>
            {item.sleep_quality ? (
              <Text style={styles.metricText}>
                Sleep <Text style={styles.metricBold}>{item.sleep_quality}</Text>/5
              </Text>
            ) : null}
            {item.energy_level ? (
              <Text style={styles.metricText}>
                Energy <Text style={styles.metricBold}>{item.energy_level}</Text>/5
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && entries.length === 0) {
    return (
      <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
        {renderHeader()}
        <JournalListSkeleton />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <EmptyState
              icon={FEATURE_ICONS.journal}
              headline="Start your pregnancy journal today"
              description="Track your mood, symptoms, and wellness journey."
              actionLabel="Create First Entry"
              onAction={handleCreateEntry}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B84C3F"
            colors={['#B84C3F']}
          />
        }
      />

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Filter <Text style={styles.modalTitleItalic}>by date</Text>
            </Text>

            <View style={styles.dateFilterSection}>
              <Text style={styles.dateFilterLabel}>Start</Text>
              {startDate ? (
                <SimpleDatePicker value={startDate} onChange={setStartDate} maximumDate={endDate || new Date()} />
              ) : (
                <TouchableOpacity style={styles.dateFilterButton} onPress={() => setStartDate(new Date())}>
                  <Text style={styles.dateFilterPlaceholder}>Select start date</Text>
                  <MaterialCommunityIcons name="calendar" size={20} color="#9C8E80" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dateFilterSection}>
              <Text style={styles.dateFilterLabel}>End</Text>
              {endDate ? (
                <SimpleDatePicker value={endDate} onChange={setEndDate} minimumDate={startDate || undefined} maximumDate={new Date()} />
              ) : (
                <TouchableOpacity style={styles.dateFilterButton} onPress={() => setEndDate(new Date())}>
                  <Text style={styles.dateFilterPlaceholder}>Select end date</Text>
                  <MaterialCommunityIcons name="calendar" size={20} color="#9C8E80" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowFilterModal(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Apply" onPress={() => { setShowFilterModal(false); loadEntries(); }} variant="primary" style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  kicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: '#2B221B',
    letterSpacing: -0.8,
    lineHeight: 32,
    marginTop: 4,
  },
  titleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  titleDot: {
    color: '#B84C3F',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInCard: {
    marginHorizontal: 16,
    backgroundColor: '#EFE7DC',
    borderRadius: 20,
    padding: 18,
  },
  checkInKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#6A5D52',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  checkInPrompt: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
    lineHeight: 24,
    marginBottom: 14,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  moodTile: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  moodTileActive: {
    backgroundColor: '#2B221B',
    borderColor: '#2B221B',
  },
  moodGlyph: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
    lineHeight: 22,
  },
  moodGlyphActive: {
    color: '#FFFFFF',
  },
  moodLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 10,
    color: '#2B221B',
    marginTop: 4,
    opacity: 0.8,
  },
  moodLabelActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 130,
  },
  entryCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryDate: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: '#2B221B',
    letterSpacing: -0.3,
  },
  entryFullDate: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
    marginTop: 2,
  },
  entryMoodWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryMoodDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryMoodLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#6A5D52',
  },
  entryQuote: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: '#6A5D52',
    lineHeight: 20,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  symptomsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#EFE7DC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  chipText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#2B221B',
    letterSpacing: 0.2,
  },
  metricsWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  metricText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
  },
  metricBold: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#2B221B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43,34,27,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    color: '#2B221B',
    letterSpacing: -0.4,
    marginBottom: 18,
  },
  modalTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  dateFilterSection: {
    marginBottom: 14,
  },
  dateFilterLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dateFilterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F6F1EA',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    minHeight: 44,
  },
  dateFilterPlaceholder: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: '#9C8E80',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});
