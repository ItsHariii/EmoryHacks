// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { SafetyTag } from './SafetyTag';
import { FoodEntry } from '../types';
import { Card } from '../ui/Card';

interface FoodEntryCardProps {
  entry: FoodEntry;
  onEdit?: (entry: FoodEntry) => void;
  onDelete?: (entryId: string) => void;
}

export const FoodEntryCard: React.FC<FoodEntryCardProps> = ({ entry, onEdit, onDelete }) => {
  return (
    <Card
      padding="lg"
      margin="sm"
      borderRadius="card"
      shadow="card"
      onPress={onEdit ? () => onEdit(entry) : undefined}
      accessibilityRole="button"
      accessibilityLabel={onEdit ? `Edit ${entry.food_name}` : entry.food_name}
    >
      <View style={styles.header}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{entry.food_name}</Text>
          <Text style={styles.servingInfo}>
            {entry.quantity} {entry.serving_size}
          </Text>
        </View>
        <View style={styles.caloriesContainer}>
          <Text style={styles.calories}>{Math.round(entry.calories_logged)}</Text>
          <Text style={styles.caloriesLabel}>cal</Text>
        </View>
      </View>

      <View style={styles.macros}>
        {entry.protein_logged && (
          <Text style={styles.macroText}>P: {Math.round(entry.protein_logged)}g</Text>
        )}
        {entry.carbs_logged && (
          <Text style={styles.macroText}>C: {Math.round(entry.carbs_logged)}g</Text>
        )}
        {entry.fat_logged && (
          <Text style={styles.macroText}>F: {Math.round(entry.fat_logged)}g</Text>
        )}
      </View>

      {entry.safety_status && (
        <View style={styles.safetyContainer}>
          <SafetyTag status={entry.safety_status} size="small" />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  foodInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  foodName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  servingInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  caloriesContainer: {
    alignItems: 'center',
  },
  calories: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
  caloriesLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  macros: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  macroText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  safetyContainer: {
    alignItems: 'flex-start',
  },
});
