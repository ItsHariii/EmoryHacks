import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { SkeletonJournalEntry } from '../SkeletonLoader';

/**
 * Skeleton screen for Journal entries list
 * Shows multiple journal entry skeletons
 */
export const JournalListSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SkeletonJournalEntry />
      <SkeletonJournalEntry />
      <SkeletonJournalEntry />
      <SkeletonJournalEntry />
      <SkeletonJournalEntry />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 120,
  },
});
