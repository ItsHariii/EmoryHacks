import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../theme';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base skeleton loader component with shimmer animation
 * Creates a gradient that moves from left to right
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.borderRadius.md,
  style,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Skeleton for a card component
 */
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <SkeletonLoader width="60%" height={24} style={styles.cardTitle} />
      <SkeletonLoader width="100%" height={16} style={styles.cardLine} />
      <SkeletonLoader width="80%" height={16} style={styles.cardLine} />
      <SkeletonLoader width="90%" height={16} />
    </View>
  );
};

/**
 * Skeleton for pregnancy week display
 */
export const SkeletonPregnancyWeek: React.FC = () => {
  return (
    <View style={styles.pregnancyCard}>
      <View style={styles.pregnancyHeader}>
        <SkeletonLoader width={80} height={80} borderRadius={theme.borderRadius.full} />
        <View style={styles.pregnancyInfo}>
          <SkeletonLoader width="70%" height={28} style={styles.pregnancyLine} />
          <SkeletonLoader width="50%" height={20} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={12} style={styles.progressBar} />
      <SkeletonLoader width="40%" height={16} style={styles.progressText} />
      <View style={styles.tipBox}>
        <SkeletonLoader width="100%" height={16} style={styles.tipLine} />
        <SkeletonLoader width="90%" height={16} />
      </View>
    </View>
  );
};

/**
 * Skeleton for macronutrient card
 */
export const SkeletonMacroCard: React.FC = () => {
  return (
    <View style={styles.macroCard}>
      <View style={styles.macroHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={theme.borderRadius.full} />
        <SkeletonLoader width="50%" height={18} />
      </View>
      <SkeletonLoader width="60%" height={32} style={styles.macroValue} />
      <SkeletonLoader width="100%" height={8} borderRadius={4} style={styles.macroProgress} />
      <SkeletonLoader width="40%" height={14} />
    </View>
  );
};

/**
 * Skeleton for micronutrient chart
 */
export const SkeletonMicronutrientChart: React.FC = () => {
  return (
    <View style={styles.microChart}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <View key={item} style={styles.microRow}>
          <SkeletonLoader width={32} height={32} borderRadius={theme.borderRadius.full} />
          <View style={styles.microInfo}>
            <SkeletonLoader width="40%" height={16} style={styles.microName} />
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={styles.microBar} />
            <SkeletonLoader width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton for food entry list
 */
export const SkeletonFoodEntry: React.FC = () => {
  return (
    <View style={styles.foodEntry}>
      <View style={styles.foodHeader}>
        <SkeletonLoader width={48} height={48} borderRadius={theme.borderRadius.md} />
        <View style={styles.foodInfo}>
          <SkeletonLoader width="70%" height={18} style={styles.foodName} />
          <SkeletonLoader width="50%" height={14} />
        </View>
      </View>
      <View style={styles.foodStats}>
        <SkeletonLoader width="30%" height={14} />
        <SkeletonLoader width="30%" height={14} />
        <SkeletonLoader width="30%" height={14} />
      </View>
    </View>
  );
};

/**
 * Skeleton for journal entry card
 */
export const SkeletonJournalEntry: React.FC = () => {
  return (
    <View style={styles.journalEntry}>
      <View style={styles.journalHeader}>
        <SkeletonLoader width={48} height={48} borderRadius={theme.borderRadius.full} />
        <View style={styles.journalInfo}>
          <SkeletonLoader width="50%" height={20} style={styles.journalDate} />
          <SkeletonLoader width="70%" height={14} />
        </View>
      </View>
      <View style={styles.journalSymptoms}>
        <SkeletonLoader width={80} height={24} borderRadius={theme.borderRadius.md} style={styles.symptomChip} />
        <SkeletonLoader width={100} height={24} borderRadius={theme.borderRadius.md} style={styles.symptomChip} />
        <SkeletonLoader width={90} height={24} borderRadius={theme.borderRadius.md} />
      </View>
      <SkeletonLoader width="100%" height={16} style={styles.journalNotes} />
      <SkeletonLoader width="80%" height={16} />
    </View>
  );
};

/**
 * Skeleton for profile info section
 */
export const SkeletonProfileInfo: React.FC = () => {
  return (
    <View style={styles.profileSection}>
      <SkeletonLoader width="40%" height={20} style={styles.profileTitle} />
      <View style={styles.profileItem}>
        <SkeletonLoader width="30%" height={14} style={styles.profileLabel} />
        <SkeletonLoader width="60%" height={18} />
      </View>
      <View style={styles.profileItem}>
        <SkeletonLoader width="25%" height={14} style={styles.profileLabel} />
        <SkeletonLoader width="70%" height={18} />
      </View>
      <View style={styles.profileItem}>
        <SkeletonLoader width="35%" height={14} style={styles.profileLabel} />
        <SkeletonLoader width="80%" height={18} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardTitle: {
    marginBottom: theme.spacing.md,
  },
  cardLine: {
    marginBottom: theme.spacing.sm,
  },
  pregnancyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  pregnancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  pregnancyInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  pregnancyLine: {
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    marginBottom: theme.spacing.lg,
  },
  tipBox: {
    backgroundColor: theme.colors.accentLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  tipLine: {
    marginBottom: theme.spacing.xs,
  },
  macroCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  macroValue: {
    marginBottom: theme.spacing.md,
  },
  macroProgress: {
    marginBottom: theme.spacing.sm,
  },
  microChart: {
    gap: theme.spacing.md,
  },
  microRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  microInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  microName: {
    marginBottom: theme.spacing.xs,
  },
  microBar: {
    marginBottom: theme.spacing.xs,
  },
  foodEntry: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  foodHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  foodInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  foodName: {
    marginBottom: theme.spacing.xs,
  },
  foodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journalEntry: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  journalInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  journalDate: {
    marginBottom: theme.spacing.xs,
  },
  journalSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  symptomChip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  journalNotes: {
    marginBottom: theme.spacing.xs,
  },
  profileSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  profileTitle: {
    marginBottom: theme.spacing.lg,
  },
  profileItem: {
    marginBottom: theme.spacing.md,
  },
  profileLabel: {
    marginBottom: theme.spacing.xs,
  },
});
