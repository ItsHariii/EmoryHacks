// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FoodEntryCard } from './FoodEntryCard';
import { FoodEntry, MealType } from '../types';

interface MealAccordionCardProps {
  mealType: MealType;
  entries: FoodEntry[];
  totalCalories: number;
  onAddFood: (mealType: MealType) => void;
  onEditEntry?: (entry: FoodEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
  /** When true, the accordion starts expanded (e.g. first non-empty meal of the day). */
  initialExpanded?: boolean;
}

const getMealDisplayName = (mealType: MealType): string => {
  const names = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks',
  };
  return names[mealType];
};

const getMealIconName = (mealType: MealType): 'food-apple' | 'white-balance-sunny' | 'weather-night' | 'fruit-cherries' => {
  const icons = {
    breakfast: 'food-apple' as const,
    lunch: 'white-balance-sunny' as const,
    dinner: 'weather-night' as const,
    snack: 'fruit-cherries' as const,
  };
  return icons[mealType];
};

export const MealAccordionCard: React.FC<MealAccordionCardProps> = ({
  mealType,
  entries,
  totalCalories,
  onAddFood,
  onEditEntry,
  onDeleteEntry,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [animation] = useState(new Animated.Value(initialExpanded ? 1 : 0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false as boolean,
    }).start();
  };

  const rotateInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={getMealIconName(mealType)}
            size={theme.iconSize.xl}
            color={theme.colors.primary}
            style={styles.mealIcon}
          />
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{getMealDisplayName(mealType)}</Text>
            <Text style={styles.entryCount}>
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.calories}>{Math.round(totalCalories)}</Text>
          <Text style={styles.caloriesLabel}>cal</Text>
          <Animated.View style={[styles.chevronWrap, { transform: [{ rotate: rotateInterpolate }] }]}>
            <MaterialCommunityIcons name="chevron-down" size={theme.iconSize.md} color={theme.colors.text.secondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <FoodEntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No foods logged yet</Text>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddFood(mealType)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={theme.iconSize.lg} color={theme.colors.text.inverse} style={styles.addButtonIcon} />
            <Text style={styles.addButtonText}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    marginRight: theme.spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  entryCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  calories: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  caloriesLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: theme.spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    minHeight: theme.layout.minTouchTarget,
    ...theme.shadows.sm,
  },
  addButtonIcon: {},
  addButtonText: {
    ...theme.typography.presets.captionBold,
    color: theme.colors.text.inverse,
  },
  chevronWrap: {
    marginLeft: theme.spacing.sm,
  },
});
