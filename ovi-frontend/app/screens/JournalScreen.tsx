// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { HeaderBar } from '../components/layout/HeaderBar';
import { SimpleDatePicker } from '../components/ui/SimpleDatePicker';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { JournalListSkeleton } from '../components/skeletons';
import { theme } from '../theme';
import { journalAPI } from '../services/api';
import { JournalEntry } from '../types';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

interface JournalScreenProps {
  navigation: any;
}

const MOOD_EMOJIS = ['', '😢', '😟', '😐', '🙂', '😊'];

export const JournalScreen: React.FC<JournalScreenProps> = ({ navigation }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date filtering state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showChatSummaries, setShowChatSummaries] = useState(false);

  const loadEntries = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

      const data = await journalAPI.getJournalEntries(startDateStr, endDateStr);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load journal entries');
      Alert.alert('Error', err.message || 'Failed to load journal entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();

    // Reload entries when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadEntries();
    });

    return unsubscribe;
  }, [navigation, startDate, endDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries(true);
  }, []);

  const handleCreateEntry = () => {
    console.log('FAB button pressed - showing alert');
    // Show options for traditional form or chat
    Alert.alert(
      'Create Journal Entry',
      'How would you like to create your entry?',
      [
        {
          text: 'Chat with Ovi',
          onPress: () => {
            console.log('Navigating to ChatJournal');
            navigation.navigate('ChatJournal');
          },
        },
        {
          text: 'Traditional Form',
          onPress: () => {
            console.log('Navigating to JournalEntry');
            navigation.navigate('JournalEntry');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditEntry = (entry: JournalEntry) => {
    navigation.navigate('JournalEntry', { entry });
  };

  const handleViewChatSummary = async (entry: JournalEntry) => {
    try {
      setLoading(true);
      const chatHistory = await journalAPI.getChatHistory(entry.entry_date);

      Alert.alert(
        formatDate(entry.entry_date),
        chatHistory.summary,
        [
          {
            text: 'Edit',
            onPress: () => navigation.navigate('JournalEntry', { entry }),
          },
          {
            text: 'Close',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      // If no chat history, just show regular entry
      handleEditEntry(entry);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setShowFilterModal(false);
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    loadEntries();
  };

  const getFilterLabel = () => {
    if (!startDate && !endDate) return 'Filter by date';
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (startDate) {
      return `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (endDate) {
      return `Until ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'Filter by date';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getMoodBorderColor = (mood: number | undefined) => {
    if (!mood) return theme.colors.borderLight;
    return theme.colors.primary;
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const moodEmoji = item.mood ? MOOD_EMOJIS[item.mood] : '';
    const notesSnippet = item.notes
      ? item.notes.length > 80
        ? item.notes.substring(0, 80) + '...'
        : item.notes
      : 'No notes';

    return (
      <TouchableOpacity
        style={[
          styles.entryCard,
          { borderLeftWidth: 4, borderLeftColor: getMoodBorderColor(item.mood) },
        ]}
        onPress={() => showChatSummaries ? handleViewChatSummary(item) : handleEditEntry(item)}
        accessibilityLabel={`Journal entry for ${formatDate(item.entry_date)}`}
        accessibilityRole="button"
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryHeaderLeft}>
            {moodEmoji && (
              <View style={styles.moodEmojiCircle}>
                <Text style={styles.moodEmoji}>{moodEmoji}</Text>
              </View>
            )}
            <View>
              <Text style={styles.entryDate}>{formatDate(item.entry_date)}</Text>
              <Text style={styles.entryFullDate}>
                {new Date(item.entry_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>

        {item.symptoms && item.symptoms.length > 0 && (
          <View style={styles.symptomsContainer}>
            {item.symptoms.slice(0, 3).map((symptom, index) => (
              <View key={index} style={styles.symptomChip}>
                <Text style={styles.symptomText}>{symptom}</Text>
              </View>
            ))}
            {item.symptoms.length > 3 && (
              <Text style={styles.moreSymptoms}>+{item.symptoms.length - 3} more</Text>
            )}
          </View>
        )}

        <Text style={styles.notesSnippet}>{notesSnippet}</Text>

        <View style={styles.entryFooter}>
          {item.sleep_quality && (
            <View style={styles.metricBadge}>
              <Text style={styles.metricLabel}>Sleep: {item.sleep_quality}/5</Text>
            </View>
          )}
          {item.energy_level && (
            <View style={styles.metricBadge}>
              <Text style={styles.metricLabel}>Energy: {item.energy_level}/5</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon={FEATURE_ICONS.journal}
      headline="Start your pregnancy journal today"
      description="Track your mood, symptoms, and wellness journey. Your entries help you understand patterns and share with your healthcare provider."
      actionLabel="Create First Entry"
      onAction={handleCreateEntry}
      style={{ marginTop: theme.spacing.xl }}
    />
  );

  if (loading) {
    return (
      <ScreenWrapper edges={['bottom']}>
        <HeaderBar
          title="My Journal"
          subtitle="Loading your entries..."
        />
        <JournalListSkeleton />
      </ScreenWrapper>
    );
  }

  const getFilterSubtitle = () => {
    if (!startDate && !endDate) return 'Your wellness journey';
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (startDate) {
      return `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (endDate) {
      return `Until ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'Your wellness journey';
  };

  return (
    <ScreenWrapper edges={['bottom']}>
      <HeaderBar
        title="My Journal"
        subtitle={getFilterSubtitle()}
        rightActions={[
          {
            icon: 'plus' as keyof typeof MaterialCommunityIcons.glyphMap,
            onPress: () => navigation.navigate('JournalEntry'),
            accessibilityLabel: 'Create new journal entry',
          },
          {
            icon: 'filter-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
            onPress: () => setShowFilterModal(true),
            accessibilityLabel: 'Filter journal entries by date',
          },
        ]}
      />

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          entries.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* Date Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Date Range</Text>

            {/* Start Date */}
            <View style={styles.dateFilterSection}>
              <Text style={styles.dateFilterLabel}>Start Date</Text>
              {startDate ? (
                <SimpleDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  maximumDate={endDate || new Date()}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setStartDate(new Date())}
                >
                  <Text style={styles.dateFilterPlaceholder}>Select start date</Text>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* End Date */}
            <View style={styles.dateFilterSection}>
              <Text style={styles.dateFilterLabel}>End Date</Text>
              {endDate ? (
                <SimpleDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  minimumDate={startDate || undefined}
                  maximumDate={new Date()}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setEndDate(new Date())}
                >
                  <Text style={styles.dateFilterPlaceholder}>Select end date</Text>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowFilterModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Apply"
                onPress={handleApplyFilters}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // Container styles removed as ScreenWrapper handles them
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.layout.screenPadding,
    paddingBottom: 120, // Space for FAB and floating tab bar
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.layout.cardPadding,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  moodEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  moodEmoji: {
    fontSize: 24,
  },
  entryDate: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  entryFullDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.text.muted,
    fontWeight: theme.fontWeight.bold,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  symptomChip: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.chip,
  },
  symptomText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  moreSymptoms: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    marginLeft: theme.spacing.xs,
  },
  notesSnippet: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  entryFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricBadge: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },

  fab: {
    position: 'absolute',
    right: theme.layout.screenPadding,
    bottom: theme.layout.screenPadding,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  fabIcon: {
    fontSize: 32,
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.layout.screenPadding,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.layout.cardPadding,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  dateFilterSection: {
    marginBottom: theme.spacing.md,
  },
  dateFilterLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  dateFilterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
  },
  dateFilterPlaceholder: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.muted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    minHeight: 48,
  },
});
