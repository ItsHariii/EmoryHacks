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
} from 'react-native';
import { theme } from '../theme';
import { journalAPI } from '../services/api';
import { JournalEntry } from '../types';

interface JournalScreenProps {
  navigation: any;
}

const MOOD_EMOJIS = ['', '😢', '😟', '😐', '🙂', '😊'];

export const JournalScreen: React.FC<JournalScreenProps> = ({ navigation }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      
      const data = await journalAPI.getJournalEntries();
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
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries(true);
  }, []);

  const handleCreateEntry = () => {
    navigation.navigate('JournalEntry');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    navigation.navigate('JournalEntry', { entry });
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

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const moodEmoji = item.mood ? MOOD_EMOJIS[item.mood] : '';
    const notesSnippet = item.notes
      ? item.notes.length > 80
        ? item.notes.substring(0, 80) + '...'
        : item.notes
      : 'No notes';

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => handleEditEntry(item)}
        accessibilityLabel={`Journal entry for ${formatDate(item.entry_date)}`}
        accessibilityRole="button"
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryHeaderLeft}>
            {moodEmoji && <Text style={styles.moodEmoji}>{moodEmoji}</Text>}
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
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📔</Text>
      <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
      <Text style={styles.emptyText}>
        Start tracking your daily symptoms, mood, and wellness by creating your first journal
        entry.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreateEntry}>
        <Text style={styles.emptyButtonText}>Create First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateEntry}
        accessibilityLabel="Create new journal entry"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  entryCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
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
    gap: theme.spacing.sm,
    flex: 1,
  },
  moodEmoji: {
    fontSize: 32,
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
    fontSize: 28,
    color: theme.colors.text.muted,
    fontWeight: theme.fontWeight.bold,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  symptomChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  },
  notesSnippet: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  entryFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.light,
    fontWeight: theme.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
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
    color: theme.colors.text.light,
    fontWeight: theme.fontWeight.bold,
  },
});
