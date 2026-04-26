import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FoodEntry, MealType } from '../../types';

interface MealAccordionCardProps {
  mealType: MealType;
  entries: FoodEntry[];
  totalCalories: number;
  mealTimeLabel: string;
  onAddFood: (mealType: MealType) => void;
  onEditEntry?: (entry: FoodEntry) => void;
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const MealAccordionCard: React.FC<MealAccordionCardProps> = ({
  mealType,
  entries,
  totalCalories,
  mealTimeLabel,
  onAddFood,
  onEditEntry,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const animation = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;
  const itemCount = entries.length;
  const isSnack = mealType === 'snack';

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.timing(animation, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const itemText = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  const totalCaloriesDisplay = useMemo(() => `${Math.round(totalCalories)} kcal`, [totalCalories]);
  const isEmptySnack = isSnack && itemCount === 0;

  const addLabel = `Add to ${mealType === 'snack' ? 'snacks' : mealType}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.headerMain}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealName}>{getMealDisplayName(mealType)}</Text>
            <Text style={styles.mealTime}>{mealTimeLabel}</Text>
          </View>
          <Text style={[styles.metaText, isEmptySnack && styles.metaTextItalic]}>
            {isEmptySnack ? 'Nothing logged yet' : `${totalCaloriesDisplay}${itemCount > 0 ? ` · ${itemText}` : ''}`}
          </Text>
        </View>
        {!isExpanded && isSnack && entries.length === 0 ? (
          <TouchableOpacity style={styles.snackAddCircle} onPress={() => onAddFood(mealType)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <Animated.View style={[styles.chevronWrap, { transform: [{ rotate: rotateInterpolate }] }]}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.text.muted} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {entries.length > 0 && entries.map((entry, index) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryRow}
              onPress={onEditEntry ? () => onEditEntry(entry) : undefined}
              activeOpacity={onEditEntry ? 0.7 : 1}
            >
              <View style={styles.entryInfo}>
                <Text style={styles.foodName}>{entry.food_name}</Text>
                <Text style={styles.servingInfo}>
                  {entry.quantity} {entry.serving_size}
                </Text>
              </View>
              <Text style={styles.foodCalories}>{Math.round(entry.calories_logged)} kcal</Text>
              {index < entries.length - 1 && <View style={styles.rowDivider} />}
            </TouchableOpacity>
          ))}

          {entries.length === 0 && (
            <Text style={styles.emptyText}>Nothing logged yet</Text>
          )}

          <TouchableOpacity
            style={styles.addTextButton}
            onPress={() => onAddFood(mealType)}
            activeOpacity={0.7}
          >
            <Text style={styles.addTextButtonLabel}>+ {addLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerMain: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mealName: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  mealTime: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  metaText: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  metaTextItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    color: theme.colors.text.muted,
  },
  chevronWrap: {
    marginTop: 8,
    marginLeft: 10,
  },
  snackAddCircle: {
    marginTop: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 2,
  },
  entryRow: {
    paddingVertical: 10,
    position: 'relative',
  },
  entryInfo: {
    marginRight: 96,
  },
  foodName: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  servingInfo: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  foodCalories: {
    position: 'absolute',
    right: 0,
    top: 10,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  rowDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: '#EEE6DA',
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  addTextButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 34,
    marginTop: 6,
  },
  addTextButtonLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.primary,
  },
});
