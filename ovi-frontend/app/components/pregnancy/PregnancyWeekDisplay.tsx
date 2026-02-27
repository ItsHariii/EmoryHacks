// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Card } from './Card';
import { IconBadge } from './icons/IconBadge';
import { TRIMESTER_ICONS, FEATURE_ICONS, ICON_BACKGROUNDS } from './icons/iconConstants';
import { theme } from '../../theme';
import { getTrimesterName, getWeekTip } from '../utils/pregnancyCalculations';
import { createFadeInSlideUpAnimation, ANIMATION_CONFIG } from '../utils/animations';

interface PregnancyWeekDisplayProps {
  week: number;
  trimester: number;
  daysUntilDue: number;
  dueDate?: string;
  onWeekChange?: (newWeek: number) => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PregnancyWeekDisplay: React.FC<PregnancyWeekDisplayProps> = ({
  week,
  trimester,
  daysUntilDue,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculate progress percentage
  const progressPercentage = Math.min((week / 40) * 100, 100);

  // Circular Progress Constants
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Get trimester-specific data
  const trimesterName = getTrimesterName(trimester);
  const trimesterIcon = TRIMESTER_ICONS[trimester as keyof typeof TRIMESTER_ICONS];
  const weekTip = getWeekTip(week);

  useEffect(() => {
    // Animate on mount
    createFadeInSlideUpAnimation(fadeAnim, slideAnim, ANIMATION_CONFIG.normal).start();

    // Animate progress circle
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 1500,
      useNativeDriver: true, // Use native driver for transform/opacity, but not for SVG props usually. 
      // However, we can animate strokeDashoffset via setNativeProps or re-render.
      // For simplicity with Animated.createAnimatedComponent, we'll use a listener or non-native if needed.
      // Actually, let's use a simpler approach: animate a value 0-1 and interpolate.
      easing: ANIMATION_CONFIG.slow.easing,
    }).start();
  }, [week]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.trimesterLabel}>{trimesterName}</Text>
            <Text style={styles.daysLabel}>{daysUntilDue} days to go</Text>
          </View>
          <IconBadge
            name={trimesterIcon}
            size="medium"
            backgroundColor={ICON_BACKGROUNDS.paleRose}
            iconColor={theme.colors.text.primary}
            shape="circular"
          />
        </View>

        <View style={styles.mainContent}>
          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <Svg width={size} height={size}>
              <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                {/* Background Circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={theme.colors.border}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress Circle */}
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={theme.colors.primary}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
            <View style={styles.centerTextContainer}>
              <Text style={styles.weekNumber}>{week}</Text>
              <Text style={styles.weekLabel}>Weeks</Text>
            </View>
          </View>

          {/* Tip Section */}
          <View style={styles.tipContainer}>
            <View style={styles.tipHeader}>
              <IconBadge
                name={FEATURE_ICONS.tip}
                size="small"
                backgroundColor={ICON_BACKGROUNDS.cream}
                iconColor={theme.colors.text.primary}
                shape="circular"
              />
              <Text style={styles.tipTitle}>Weekly Tip</Text>
            </View>
            <Text style={styles.tipText}>{weekTip}</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  trimesterLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  daysLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNumber: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  weekLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  tipContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  tipTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  tipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
