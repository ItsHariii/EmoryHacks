import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../theme';
import { MealAccordionCard } from '../components/food/MealAccordionCard';
import { EmptyState } from '../components/ui/EmptyState';
import { FoodListSkeleton } from '../components/skeletons';
import { SimpleDatePicker } from '../components/ui/SimpleDatePicker';
import { ProgressBar } from '../components/charts/ProgressBar';
import { foodAPI, nutritionAPI } from '../services/api';
import { FoodEntry, MealType, NutritionSummary } from '../types';
import { FEATURE_ICONS } from '../components/icons/iconConstants';
import { useNutritionStore } from '../store/useNutritionStore';

import type { FoodStackParamList } from '../types/navigation';

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isToday(d: Date): boolean {
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

function formatDateLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return d.toLocaleDateString(undefined, options);
}

type FoodLoggingScreenNavigationProp = StackNavigationProp<
  FoodStackParamList,
  'FoodLoggingMain'
>;

export const FoodLoggingScreen: React.FC = () => {
  const navigation = useNavigation<FoodLoggingScreenNavigationProp>();
  const { targets, fetchTargets } = useNutritionStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
    navigation.navigate('SearchFood', { mealType });
  };

  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner', { mealType: 'snack' });
  };

  const handleSearchFood = () => {
    navigation.navigate('SearchFood', { mealType: 'breakfast' });
  };

  const handleEditEntry = (entry: FoodEntry) => {
    navigation.navigate('EditFoodEntry', { entry });
  };

  const handleDeleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
        onPress: async () => {
            try {
              await foodAPI.deleteFoodEntry(entryId);
              await loadData(); // Refresh data
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const groupedEntries = groupEntriesByMeal(foodEntries);
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  if (loading && foodEntries.length === 0) {
    return (
      <ScreenWrapper edges={['bottom']} backgroundColor={theme.colors.background}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.titleKicker}>Food</Text>
              <Text style={styles.title}>Log</Text>
              <Text style={styles.subtitle}>Loading your meals...</Text>
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
              <Text style={styles.titleKicker}>{formatDateLabel(selectedDate).toUpperCase()}</Text>
              <Text style={styles.title}>
                Food <Text style={styles.titleItalic}>log</Text>
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchFood} activeOpacity={0.8}>
                <MaterialCommunityIcons name="magnify" size={theme.iconSize.lg} color={theme.colors.text.primary} />
                <Text style={styles.scanButtonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode} testID="scan-button" activeOpacity={0.8}>
                <MaterialCommunityIcons name="barcode-scan" size={theme.iconSize.lg} color={theme.colors.text.primary} />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.datePickerWrap}>
          <SimpleDatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            maximumDate={new Date()}
          />
        </View>

        {nutritionSummary && (foodEntries.length > 0 || nutritionSummary.total_calories > 0) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{formatDateLabel(selectedDate)}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCalories}>
                <Text style={styles.summaryCaloriesValue}>{Math.round(nutritionSummary.total_calories)}</Text>
                <Text style={styles.summaryCaloriesLabel}>kcal</Text>
              </View>
              <View style={styles.summaryMacros}>
                <Text style={styles.macroItem}>P {Math.round(nutritionSummary.protein_g || 0)}g</Text>
                <Text style={styles.macroItem}>C {Math.round(nutritionSummary.carbs_g || 0)}g</Text>
                <Text style={styles.macroItem}>F {Math.round(nutritionSummary.fat_g || 0)}g</Text>
              </View>
            </View>
            {targets && targets.calories > 0 && (
              <View style={styles.progressWrap}>
                <ProgressBar
                  current={nutritionSummary.total_calories}
                  target={targets.calories}
                  label="Calories"
                  color={theme.colors.primary}
                  showNumbers={true}
                />
              </View>
            )}
          </View>
        )}

        {foodEntries.length === 0 ? (
          <View style={styles.emptyStateWrapper}>
            <View style={styles.emptyStateContainer}>
              <EmptyState
                icon={FEATURE_ICONS.food}
                headline={isToday(selectedDate) ? 'No meals logged today' : `No meals logged for ${formatDateLabel(selectedDate)}`}
                description="Add foods by searching or scanning a barcode to track nutrition and reach your goals."
                actionLabel="Search Food"
                onAction={handleSearchFood}
              />
              <TouchableOpacity style={styles.secondaryActionButton} onPress={handleScanBarcode} activeOpacity={0.8}>
                <MaterialCommunityIcons name="barcode-scan" size={theme.iconSize.lg} color={theme.colors.primary} />
                <Text style={styles.secondaryActionLabel}>Scan barcode</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
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
                  onAddFood={handleAddFood}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  initialExpanded={entriesForMeal.length > 0 && isFirstNonEmpty}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // Container styles removed as ScreenWrapper handles them
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  header: {
    padding: theme.layout.screenPadding,
    paddingTop: 60,
    backgroundColor: theme.colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titleKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.text.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    fontWeight: '400',
    color: theme.colors.text.primary,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  titleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
    minHeight: theme.layout.minTouchTarget,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
    minHeight: theme.layout.minTouchTarget,
  },
  scanButtonText: {
    color: theme.colors.primary,
    ...theme.typography.presets.captionBold,
  },
  datePickerWrap: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  summaryCard: {
    marginHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  summaryTitle: {
    ...theme.typography.presets.captionBold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryCalories: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  summaryCaloriesValue: {
    ...theme.typography.presets.heading3,
    color: theme.colors.primary,
  },
  summaryCaloriesLabel: {
    ...theme.typography.presets.caption,
    color: theme.colors.text.secondary,
  },
  summaryMacros: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  macroItem: {
    ...theme.typography.presets.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressWrap: {
    marginTop: theme.spacing.sm,
  },
  mealsContainer: {
    padding: theme.layout.screenPadding,
    gap: theme.spacing.md,
  },
  emptyStateWrapper: {
    flex: 1,
    paddingTop: theme.spacing.lg,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    paddingHorizontal: theme.layout.screenPadding,
    alignItems: 'center',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.layout.minTouchTarget,
    ...theme.shadows.sm,
  },
  secondaryActionLabel: {
    ...theme.typography.presets.captionBold,
    color: theme.colors.primary,
  },
});
