import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { MACRONUTRIENT_ICONS } from './icons/iconConstants';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionPreviewProps {
  nutrition: NutritionData | null;
}

/**
 * NutritionPreview Component
 * 
 * Displays calculated nutrition information before logging
 */
export const NutritionPreview: React.FC<NutritionPreviewProps> = ({ nutrition }) => {
  if (!nutrition) {
    return null;
  }

  const nutrients = [
    {
      name: 'Calories',
      value: Math.round(nutrition?.calories || 0),
      unit: 'kcal',
      icon: MACRONUTRIENT_ICONS.calories,
      color: theme.colors.primary,
    },
    {
      name: 'Protein',
      value: Math.round(nutrition?.protein || 0),
      unit: 'g',
      icon: MACRONUTRIENT_ICONS.protein,
      color: theme.colors.accent,
    },
    {
      name: 'Carbs',
      value: Math.round(nutrition?.carbs || 0),
      unit: 'g',
      icon: MACRONUTRIENT_ICONS.carbs,
      color: theme.colors.success,
    },
    {
      name: 'Fat',
      value: Math.round(nutrition?.fat || 0),
      unit: 'g',
      icon: MACRONUTRIENT_ICONS.fat,
      color: theme.colors.warning,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Preview</Text>
      <View style={styles.grid}>
        {nutrients.map((nutrient) => (
          <View key={nutrient.name} style={styles.nutrientCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${nutrient.color}20` },
              ]}
            >
              <MaterialCommunityIcons
                name={nutrient.icon as any}
                size={20}
                color={nutrient.color}
              />
            </View>
            <Text style={styles.nutrientValue}>
              {nutrient.value}
              <Text style={styles.nutrientUnit}> {nutrient.unit}</Text>
            </Text>
            <Text style={styles.nutrientName}>{nutrient.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  nutrientCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  nutrientValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  nutrientUnit: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
  },
  nutrientName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
