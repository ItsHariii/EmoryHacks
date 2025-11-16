import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card } from './Card';
import { IconBadge } from './icons/IconBadge';
import { TRIMESTER_ICONS, FEATURE_ICONS, ICON_BACKGROUNDS } from './icons/iconConstants';
import { theme } from '../theme';
import { getTrimesterName, getWeekTip } from '../utils/pregnancyCalculations';
import { createProgressFillAnimation, createFadeInSlideUpAnimation, ANIMATION_CONFIG } from '../utils/animations';

interface PregnancyWeekDisplayProps {
  week: number;
  trimester: number;
  daysUntilDue: number;
  dueDate?: string;
  onWeekChange?: (newWeek: number) => void;
}

export const PregnancyWeekDisplay: React.FC<PregnancyWeekDisplayProps> = ({
  week,
  trimester,
  daysUntilDue,
}) => {
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  // Calculate progress percentage
  const progressPercentage = (week / 40) * 100;

  // Get trimester-specific data
  const trimesterName = getTrimesterName(trimester);
  const trimesterIcon = TRIMESTER_ICONS[trimester as keyof typeof TRIMESTER_ICONS];
  const weekTip = getWeekTip(week);

  useEffect(() => {
    // Animate on mount
    createFadeInSlideUpAnimation(fadeAnim, slideAnim, ANIMATION_CONFIG.normal).start();
    
    // Animate progress bar
    createProgressFillAnimation(progressAnim, progressPercentage, ANIMATION_CONFIG.slow).start();
  }, [week]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Card
        shadow="lg"
        padding="lg"
        borderRadius="xl"
        accessibilityRole="summary"
        accessibilityLabel={`Pregnancy week ${week}, ${trimesterName}, ${daysUntilDue} days until due date`}
      >
        {/* Week Number with Gradient Ring */}
        <View style={styles.weekSection}>
          <View style={styles.weekNumberContainer}>
            {/* Subtle ring backdrop */}
            <View style={styles.gradientRing} />
            
            <Text
              style={styles.weekNumber}
              accessible={true}
              accessibilityLabel={`Week ${week}`}
            >
              {week}
            </Text>
          </View>
          
          <Text style={styles.weekLabel}>Week</Text>
        </View>

        {/* Visual Divider */}
        <View style={styles.divider} />

        {/* Trimester Info */}
        <View style={styles.trimesterSection}>
          <IconBadge
            name={trimesterIcon}
            size="medium"
            backgroundColor={ICON_BACKGROUNDS.paleRose}
            iconColor={theme.colors.text.primary}
            shape="circular"
            accessibilityLabel={trimesterName}
          />
          
          <View style={styles.trimesterTextContainer}>
            <Text style={styles.trimesterName}>{trimesterName}</Text>
            <Text style={styles.daysUntilDue}>
              {daysUntilDue} days until due date
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
          
          <Text style={styles.progressText}>
            Week {week} of 40
          </Text>
        </View>

        {/* Week-Specific Tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipIconContainer}>
            <IconBadge
              name={FEATURE_ICONS.tip}
              size="small"
              backgroundColor={ICON_BACKGROUNDS.cream}
              iconColor={theme.colors.text.primary}
              shape="circular"
              accessibilityLabel="Tip"
            />
          </View>
          
          <Text
            style={styles.tipText}
            accessible={true}
            accessibilityLabel={`Tip: ${weekTip}`}
            accessibilityRole="text"
          >
            {weekTip}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  weekSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  weekNumberContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  gradientRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
    backgroundColor: theme.colors.primary,
  },
  weekNumber: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    lineHeight: theme.typography.fontSize.xxxl * theme.typography.lineHeight.tight,
  },
  weekLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  trimesterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  trimesterTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  trimesterName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  daysUntilDue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressSection: {
    marginBottom: theme.spacing.lg,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressTrack: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: ICON_BACKGROUNDS.cream,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'flex-start',
  },
  tipIconContainer: {
    marginRight: theme.spacing.md,
    paddingTop: 2, // Slight adjustment for visual alignment
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
});
