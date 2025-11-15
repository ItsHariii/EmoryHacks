import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import { SafetyTag } from '../components/SafetyTag';
import { foodAPI } from '../services/api';
import { FoodItem, MealType } from '../types';

interface RouteParams {
  mealType: MealType;
}

export const SearchFoodScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType } = route.params as RouteParams;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    try {
      const recent = await foodAPI.getRecentFoods(10);
      setRecentFoods(recent);
    } catch (error) {
      console.error('Error loading recent foods:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await foodAPI.search(searchQuery.trim());
      setSearchResults(results.foods);
      setSearched(true);
    } catch (error) {
      console.error('Error searching foods:', error);
      Alert.alert('Error', 'Failed to search foods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = (food: FoodItem) => {
    (navigation as any).navigate('EditFoodEntry', { 
      food, 
      mealType,
      isNewEntry: true 
    });
  };

  const renderFoodItem = (food: FoodItem) => (
    <TouchableOpacity
      key={food.id}
      style={styles.foodItem}
      onPress={() => handleFoodSelect(food)}
      activeOpacity={0.7}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
        <Text style={styles.foodCalories}>
          {food.calories_per_100g} cal per 100g
        </Text>
      </View>
      {food.safety_status && (
        <SafetyTag status={food.safety_status} size="small" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add to {mealType}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for food..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          placeholderTextColor={theme.colors.text.muted}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.light} size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {!searched && recentFoods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Foods</Text>
            {recentFoods.map(renderFoodItem)}
          </View>
        )}

        {searched && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Search Results ({searchResults.length})
            </Text>
            {searchResults.length > 0 ? (
              searchResults.map(renderFoodItem)
            ) : (
              <Text style={styles.emptyText}>
                No foods found. Try a different search term.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  backButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    textTransform: 'capitalize',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text.primary,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  resultsContainer: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  foodItem: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
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
  foodBrand: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  foodCalories: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: theme.spacing.xl,
  },
});
