import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../theme';
import { MealAccordionCard } from '../components/food/MealAccordionCard';
import { FoodListSkeleton } from '../components/skeletons';
import { foodAPI, nutritionAPI } from '../services/api';
import { FoodEntry, MealType, NutritionSummary } from '../types';
import { useNutritionStore } from '../store/useNutritionStore';

import type { FoodStackParamList } from '../types/navigation';

function toDateString(d: Date): string {
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
}

function formatHeaderDateLabel(d: Date): string {
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const monthDay = d
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    .replace(',', '')
    .toUpperCase();
  return `${weekday} · ${monthDay}`;
}

type FoodLoggingScreenNavigationProp = StackNavigationProp<
  FoodStackParamList,
  'FoodLoggingMain'
>;

export const FoodLoggingScreen: React.FC = () => {
  const navigation = useNavigation<FoodLoggingScreenNavigationProp>();
  const route = useRoute<any>();
  const { targets, fetchTargets } = useNutritionStore();
  const [selectedDate] = useState<Date>(() => {
    const routeDate = route.params?.date;
    return routeDate ? new Date(routeDate) : new Date();
  });
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dateStr = toDateString(selectedDate);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [entries, summary] = await Promise.all([
        foodAPI.getFoodEntries(dateStr),
        nutritionAPI.getDailySummary(dateStr),
      ]);
      setFoodEntries(entries);
      setNutritionSummary(summary);
    } catch (error) {
      console.error('Error loading food data:', error);
      Alert.alert('Error', 'Failed to load food data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const groupEntriesByMeal = (entries: FoodEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.meal_type]) {
        acc[entry.meal_type] = [];
      }
      acc[entry.meal_type].push(entry);
      return acc;
    }, {} as Record<MealType, FoodEntry[]>);
  };

  const getCaloriesForMeal = (mealType: MealType, entries: FoodEntry[]) => {
    return entries
      .filter(entry => entry.meal_type === mealType)
      .reduce((total, entry) => total + entry.calories_logged, 0);
  };

  const handleAddFood = (mealType: MealType) => {
    navigation.navigate('SearchFood', {
      mealType,
      date: selectedDate.toISOString(),
    });
  };

  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner', {
      mealType: 'snack',
      date: selectedDate.toISOString(),
    });
  };

  const handleSearchFood = () => {
    navigation.navigate('SearchFood', {
      mealType: 'breakfast',
      date: selectedDate.toISOString(),
    });
  };

  const handleEditEntry = (entry: FoodEntry) => {
    navigation.navigate('EditFoodEntry', { entry });
  };

  const groupedEntries = groupEntriesByMeal(foodEntries);
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const targetCalories = targets?.calories || 2200;
  const totalCalories = Math.round(nutritionSummary?.total_calories || 0);
  const remainingCalories = Math.max(targetCalories - totalCalories, 0);
  const progress = Math.min(totalCalories / Math.max(targetCalories, 1), 1);

  const mealTimeByType = useMemo(() => {
    const fallback: Record<MealType, string> = {
      breakfast: '8:20 AM',
      lunch: '12:45 PM',
      dinner: '7:10 PM',
      snack: '',
    };
    const result = { ...fallback };
    mealTypes.forEach((meal) => {
      const firstEntry = groupedEntries[meal]?.[0];
      if (!firstEntry?.logged_at) return;
      result[meal] = new Date(firstEntry.logged_at).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    });
    return result;
  }, [groupedEntries]);

  if (loading && foodEntries.length === 0) {
    return (
      <ScreenWrapper edges={['bottom']} backgroundColor={theme.colors.background}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.dateLabel}>{formatHeaderDateLabel(selectedDate)}</Text>
              <Text style={styles.title}>Food <Text style={styles.titleItalic}>log</Text></Text>
            </View>
          </View>
        </View>
        <FoodListSkeleton />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor={theme.colors.background}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.dateLabel}>{formatHeaderDateLabel(selectedDate)}</Text>
              <Text style={styles.title}>
                Food <Text style={styles.titleItalic}>log</Text>
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconCircleButton} onPress={handleSearchFood} activeOpacity={0.8}>
                <MaterialCommunityIcons name="magnify" size={theme.iconSize.lg} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircleButton} onPress={handleScanBarcode} testID="scan-button" activeOpacity={0.8}>
                <MaterialCommunityIcons name="barcode-scan" size={theme.iconSize.lg} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>CALORIES</Text>
              <Text style={styles.summaryCaloriesText}>
                {totalCalories.toLocaleString()}
                <Text style={styles.summaryCaloriesInline}> / {targetCalories.toLocaleString()} kcal</Text>
              </Text>
            </View>
            <View style={styles.summaryBlockRight}>
              <Text style={styles.summaryLabel}>REMAINING</Text>
              <Text style={styles.remainingValue}>{remainingCalories.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroItemWrap}>
              <View style={[styles.macroDot, { backgroundColor: theme.colors.macroProtein }]} />
              <Text style={styles.macroText}>Protein {Math.round(nutritionSummary?.protein_g || 0)}g</Text>
            </View>
            <View style={styles.macroItemWrap}>
              <View style={[styles.macroDot, { backgroundColor: theme.colors.macroCarbs }]} />
              <Text style={styles.macroText}>Carbs {Math.round(nutritionSummary?.carbs_g || 0)}g</Text>
            </View>
            <View style={styles.macroItemWrap}>
              <View style={[styles.macroDot, { backgroundColor: theme.colors.macroFats }]} />
              <Text style={styles.macroText}>Fats {Math.round(nutritionSummary?.fat_g || 0)}g</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>TODAY'S MEALS</Text>

        <View style={styles.mealsContainer}>
          {mealTypes.map((mealType, index) => {
            const entriesForMeal = groupedEntries[mealType] || [];
            const isFirstNonEmpty = mealTypes.findIndex(m => (groupedEntries[m]?.length ?? 0) > 0) === index;
            return (
              <MealAccordionCard
                key={mealType}
                mealType={mealType}
                entries={entriesForMeal}
                totalCalories={getCaloriesForMeal(mealType, foodEntries)}
                mealTimeLabel={mealTimeByType[mealType]}
                onAddFood={handleAddFood}
                onEditEntry={handleEditEntry}
                initialExpanded={entriesForMeal.length > 0 && isFirstNonEmpty}
              />
            );
          })}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F6F1EA',
  },
  scrollViewContent: {
    paddingBottom: 96,
    backgroundColor: '#F6F1EA',
  },
  header: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 58,
    paddingBottom: 16,
    backgroundColor: '#F6F1EA',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.text.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 32,
    color: theme.colors.text.primary,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  titleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: theme.layout.screenPadding,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryBlock: {
    flex: 1,
  },
  summaryBlockRight: {
    alignItems: 'flex-end',
    marginLeft: 14,
  },
  summaryLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.text.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryCaloriesText: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: theme.colors.text.primary,
  },
  summaryCaloriesInline: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  remainingValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 32,
    color: theme.colors.primary,
    lineHeight: 36,
  },
  progressTrack: {
    marginTop: 8,
    width: '100%',
    height: 4,
    borderRadius: 4,
    backgroundColor: '#E6DED2',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  macroRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  macroItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 12,
    marginHorizontal: theme.layout.screenPadding,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  mealsContainer: {
    paddingHorizontal: theme.layout.screenPadding,
    gap: 12,
  },
});
