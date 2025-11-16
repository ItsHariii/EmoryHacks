import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { MealAccordionCard } from '../components/MealAccordionCard';
import { EmptyState } from '../components/EmptyState';
import { FoodListSkeleton } from '../components/skeletons';
import { foodAPI, nutritionAPI } from '../services/api';
import { FoodEntry, MealType, NutritionSummary } from '../types';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

export const FoodLoggingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entries, summary] = await Promise.all([
        foodAPI.getFoodEntries(),
        nutritionAPI.getDailySummary(),
      ]);
      setFoodEntries(entries);
      setNutritionSummary(summary);
    } catch (error) {
      console.error('Error loading food data:', error);
      Alert.alert('Error', 'Failed to load food data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
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
    (navigation as any).navigate('SearchFood', { mealType });
  };

  const handleScanBarcode = () => {
    (navigation as any).navigate('BarcodeScanner', { mealType: 'snack' });
  };

  const handleEditEntry = (entry: FoodEntry) => {
    (navigation as any).navigate('EditFoodEntry', { entry });
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
            } catch (error) {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Food Log</Text>
              <Text style={styles.subtitle}>Loading your meals...</Text>
            </View>
          </View>
        </View>
        <FoodListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Food Log</Text>
              <Text style={styles.subtitle}>
                {nutritionSummary ? `${Math.round(nutritionSummary.calories)} calories today` : 'Track your nutrition'}
              </Text>
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode}>
              <Text style={styles.scanButtonText}>📷 Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {foodEntries.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={FEATURE_ICONS.food}
              headline="No meals logged today"
              description="Ready to add your first meal? Track your nutrition to see your progress and reach your goals."
              actionLabel="Log Your First Meal"
              onAction={() => handleAddFood('breakfast')}
            />
          </View>
        ) : (
          <View style={styles.mealsContainer}>
            {mealTypes.map((mealType) => (
              <MealAccordionCard
                key={mealType}
                mealType={mealType}
                entries={groupedEntries[mealType] || []}
                totalCalories={getCaloriesForMeal(mealType, foodEntries)}
                onAddFood={handleAddFood}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.light,
  },
  scanButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  scanButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  mealsContainer: {
    padding: theme.spacing.md,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: theme.spacing.xxl,
  },
});
