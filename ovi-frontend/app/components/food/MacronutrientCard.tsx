// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../theme';
import { createProgressFillAnimation } from '../../utils/animations';

interface MacronutrientCardProps {
  name: 'calories' | 'protein' | 'carbs' | 'fat';
  current: number;
  target: number;
  unit: string;
}

// Unified coral family — same hue, three weights, all sourced from theme
const MACRO_FILL = {
  protein:  theme.colors.macroProtein,
  carbs:    theme.colors.macroCarbs,
  fat:      theme.colors.macroFats,
  calories: theme.colors.primary,
};

const DISPLAY_NAMES = {
  calories: 'Calories',
  protein:  'Protein',
  carbs:    'Carbs',
  fat:      'Fats',
};

const MacronutrientCardComponent: React.FC<MacronutrientCardProps> = ({
  name,
  current,
  target,
  unit,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const fillColor = MACRO_FILL[name] ?? MACRO_FILL.calories;

  useEffect(() => {
    createProgressFillAnimation(progressAnim, percentage).start();
  }, [percentage]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{DISPLAY_NAMES[name]}</Text>
        <Text style={styles.value}>
          {Math.round(current)}{unit}
          <Text style={styles.target}> / {Math.round(target)}{unit}</Text>
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  value: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  target: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.borderLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

export const MacronutrientCard = React.memo(MacronutrientCardComponent);
