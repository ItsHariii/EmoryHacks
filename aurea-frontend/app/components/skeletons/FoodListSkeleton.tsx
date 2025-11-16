import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { SkeletonFoodEntry, SkeletonLoader } from '../SkeletonLoader';

/**
 * Skeleton screen for Food Logging list
 * Shows multiple food entry skeletons grouped by meal type
 */
export const FoodListSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Meal Section 1 */}
      <View style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <SkeletonLoader width={120} height={24} />
          <SkeletonLoader width={80} height={20} />
        </View>
        <SkeletonFoodEntry />
        <SkeletonFoodEntry />
      </View>

      {/* Meal Section 2 */}
      <View style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <SkeletonLoader width={100} height={24} />
          <SkeletonLoader width={80} height={20} />
        </View>
        <SkeletonFoodEntry />
      </View>

      {/* Meal Section 3 */}
      <View style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <SkeletonLoader width={110} height={24} />
          <SkeletonLoader width={80} height={20} />
        </View>
        <SkeletonFoodEntry />
        <SkeletonFoodEntry />
        <SkeletonFoodEntry />
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
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  mealSection: {
    marginBottom: theme.spacing.lg,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
});
