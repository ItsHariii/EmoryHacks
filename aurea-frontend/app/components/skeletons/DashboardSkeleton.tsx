import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import {
  SkeletonPregnancyWeek,
  SkeletonMacroCard,
  SkeletonMicronutrientChart,
} from '../SkeletonLoader';

/**
 * Skeleton screen for Dashboard
 * Matches the actual Dashboard layout with pregnancy week, macros, and micronutrients
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Pregnancy Week Section */}
      <View style={styles.section}>
        <SkeletonPregnancyWeek />
      </View>

      {/* Macronutrients Section */}
      <View style={styles.section}>
        <View style={styles.macroGrid}>
          <SkeletonMacroCard />
          <SkeletonMacroCard />
        </View>
        <View style={styles.macroGrid}>
          <SkeletonMacroCard />
          <SkeletonMacroCard />
        </View>
      </View>

      {/* Micronutrients Section */}
      <View style={styles.section}>
        <SkeletonMicronutrientChart />
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
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
