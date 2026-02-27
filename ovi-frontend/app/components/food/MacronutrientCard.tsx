// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { createProgressFillAnimation } from '../../utils/animations';

interface MacronutrientCardProps {
  name: 'calories' | 'protein' | 'carbs' | 'fat';
  current: number;
  target: number;
  unit: string;
  color?: string;
}

// Refined Pastel Themes matching the new aesthetic
const THEMES = {
  protein: {
    bg: '#FFF8F6', // Very light warm peach
    barBg: '#FFE4D6',
    fill: ['#FFBCA0', '#FF9E80'], // Soft Peach/Orange
    label: '#D65A5A', // Matching primary color
  },
  carbs: {
    bg: '#F9F7F2', // Warm beige
    barBg: '#EFEBE0',
    fill: ['#D7CCC8', '#BCAAA4'], // Soft Brown/Beige
    label: '#8D6E63',
  },
  fat: {
    bg: '#F8F7FF', // Very light lavender
    barBg: '#EDE7F6',
    fill: ['#D1C4E9', '#B39DDB'], // Soft Purple
    label: '#7E57C2',
  },
  calories: {
    bg: '#FFF5F5',
    barBg: '#FFEBEE',
    fill: ['#EF9A9A', '#E57373'],
    label: '#C62828',
  },
};

const DISPLAY_NAMES = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fats',
};

export const MacronutrientCard: React.FC<MacronutrientCardProps> = ({
  name,
  current,
  target,
  unit,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((current / target) * 100, 100);

  const themeColors = THEMES[name] || THEMES.calories;

  useEffect(() => {
    createProgressFillAnimation(progressAnim, percentage).start();
  }, [percentage]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: themeColors.label }]}>
          {DISPLAY_NAMES[name]}
        </Text>
        <Text style={[styles.value, { color: themeColors.label }]}>
          {Math.round(current)}g
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: themeColors.barBg }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={themeColors.fill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  track: {
    height: 10, // Slightly thinner for elegance but still substantial
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
  gradient: {
    flex: 1,
  },
});
