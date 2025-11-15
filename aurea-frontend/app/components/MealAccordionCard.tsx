import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../theme';
import { FoodEntryCard } from './FoodEntryCard';
import { FoodEntry, MealType } from '../types';

interface MealAccordionCardProps {
  mealType: MealType;
  entries: FoodEntry[];
  totalCalories: number;
  onAddFood: (mealType: MealType) => void;
  onEditEntry?: (entry: FoodEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
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

const getMealIcon = (mealType: MealType): string => {
  const icons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

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
          <Text style={styles.mealIcon}>{getMealIcon(mealType)}</Text>
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
          <Animated.Text 
            style={[styles.chevron, { transform: [{ rotate: rotateInterpolate }] }]}
          >
            ▼
          </Animated.Text>
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
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
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
    fontSize: theme.fontSize.xl,
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
  chevron: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  addButtonIcon: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.light,
    fontWeight: theme.fontWeight.bold,
    marginRight: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.light,
  },
});
