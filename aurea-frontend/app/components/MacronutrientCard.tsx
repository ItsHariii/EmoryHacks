import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card } from './Card';
import { IconBadge } from './icons/IconBadge';
import { MACRONUTRIENT_ICONS, ICON_BACKGROUNDS } from './icons/iconConstants';
import { theme } from '../theme';
import { createProgressFillAnimation, createPulseAnimation } from '../utils/animations';

interface MacronutrientCardProps {
  name: 'calories' | 'protein' | 'carbs' | 'fat';
  current: number;
  target: number;
  unit: string;
  color?: string;
}

// Icon background colors for each macronutrient
const NUTRIENT_BACKGROUNDS: Record<string, string> = {
  calories: ICON_BACKGROUNDS.paleRose,
  protein: ICON_BACKGROUNDS.cream,
  carbs: ICON_BACKGROUNDS.lightBlue,
  fat: ICON_BACKGROUNDS.paleRose,
};

// Display names for macronutrients
const NUTRIENT_NAMES: Record<string, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

export const MacronutrientCard: React.FC<MacronutrientCardProps> = ({
  name,
  current,
  target,
  unit,
  color = theme.colors.primary,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Calculate percentage
  const percentage = Math.min((current / target) * 100, 100);
  const isOverTarget = current > target;
  
  // Determine encouraging message based on percentage
  const getEncouragingMessage = (): string | null => {
    if (percentage >= 100) {
      return 'Great job!';
    } else if (percentage >= 80) {
      return 'Almost there!';
    } else if (percentage >= 50) {
      return 'Keep going!';
    }
    return null;
  };
  
  const encouragingMessage = getEncouragingMessage();
  
  // Animate progress bar on mount
  useEffect(() => {
    createProgressFillAnimation(progressAnim, percentage).start();
  }, [percentage]);

  // Add subtle pulse animation to icon when goal is reached
  useEffect(() => {
    if (percentage >= 100) {
      const pulseAnimation = createPulseAnimation(iconPulseAnim, 0.98, 1.02, 1500);
      pulseAnimation.start();
      
      return () => {
        pulseAnimation.stop();
      };
    } else {
      iconPulseAnim.setValue(1);
    }
  }, [percentage]);
  
  // Get icon and background color
  const iconName = MACRONUTRIENT_ICONS[name];
  const backgroundColor = NUTRIENT_BACKGROUNDS[name];
  const displayName = NUTRIENT_NAMES[name];
  
  // Use success color when exceeding 100%
  const progressColor = isOverTarget ? theme.colors.success : color;
  
  return (
    <Card
      padding="md"
      shadow="md"
      style={styles.card}
      accessibilityLabel={`${displayName}: ${Math.round(current)} of ${Math.round(target)} ${unit}, ${Math.round(percentage)}% complete`}
      accessibilityRole="summary"
    >
      {/* Icon and nutrient name at top */}
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: iconPulseAnim }] }}>
          <IconBadge
            name={iconName}
            size="medium"
            backgroundColor={backgroundColor}
            iconColor={theme.colors.text.primary}
            shape="circular"
          />
        </Animated.View>
        <Text style={styles.nutrientName}>{displayName}</Text>
      </View>
      
      {/* Current value in large font */}
      <Text style={styles.currentValue}>
        {Math.round(current)}
        <Text style={styles.unit}> {unit}</Text>
      </Text>
      
      {/* Progress bar with animated fill */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
      </View>
      
      {/* Target value below progress bar */}
      <Text style={styles.targetValue}>
        Target: {Math.round(target)} {unit}
      </Text>
      
      {/* Encouraging message */}
      {encouragingMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.encouragingMessage}>{encouragingMessage}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  nutrientName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  currentValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  unit: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  percentage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  targetValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  messageContainer: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  encouragingMessage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.success,
    textAlign: 'center',
  },
});
