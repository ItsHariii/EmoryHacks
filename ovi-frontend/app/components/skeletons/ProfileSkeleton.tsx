import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { SkeletonProfileInfo, SkeletonPregnancyWeek } from '../SkeletonLoader';

/**
 * Skeleton screen for Profile
 * Shows profile info and pregnancy progress skeletons
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Personal Information Section */}
      <View style={styles.section}>
        <SkeletonProfileInfo />
      </View>

      {/* Pregnancy Progress Section */}
      <View style={styles.section}>
        <SkeletonPregnancyWeek />
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <SkeletonProfileInfo />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
});
