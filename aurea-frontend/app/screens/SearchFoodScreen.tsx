import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HeaderBar } from '../components/HeaderBar';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme';
import { SafetyTag } from '../components/SafetyTag';
import { foodAPI } from '../services/api';
import { FoodItem, MealType } from '../types';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

interface RouteParams {
  mealType?: MealType;
}

export const SearchFoodScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType = 'breakfast' } = (route.params as RouteParams) || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim()) {
      debounceTimer.current = setTimeout(() => {
        handleSearch(1);
      }, 300);
    } else {
      setSearchResults([]);
      setSearched(false);
      setCurrentPage(1);
      setHasMore(true);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const loadRecentFoods = async () => {
    try {
      const recent = await foodAPI.getRecentFoods(10);
      setRecentFoods(recent);
    } catch (error) {
      // Recent foods endpoint not implemented yet - silently fail
      // The UI will just not show the recent foods section
      setRecentFoods([]);
    }
  };

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);

    try {
      const results = await foodAPI.search(searchQuery.trim());
      setSearchResults(results.foods);
      setSearched(true);
      setTotalResults(results.total);
      setHasMore(false); // No pagination support yet
    } catch (error) {
      // Silently handle search errors - backend may have validation issues
      // Just show empty results instead of alerting the user
      setSearchResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    // Pagination not supported yet
  };

  const handleFoodSelect = (food: FoodItem) => {
    (navigation as any).navigate('EditFoodEntry', { 
      food, 
      mealType,
      isNewEntry: true 
    });
  };

  const renderFoodItem = ({ item: food }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleFoodSelect(food)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}${food.brand ? ` by ${food.brand}` : ''}, ${food.calories_per_100g} calories per 100 grams`}
      accessibilityHint="Double tap to select this food"
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
        <View style={styles.foodDetails}>
          <Text style={styles.foodCalories}>
            {food.calories_per_100g} cal per 100g
          </Text>
          {food.serving_size && food.serving_unit && (
            <Text style={styles.servingSize}>
              • Serving: {food.serving_size}{food.serving_unit}
            </Text>
          )}
        </View>
      </View>
      {food.safety_status && (
        <SafetyTag status={food.safety_status} size="small" />
      )}
    </TouchableOpacity>
  );

  const renderRecentFoodItem = ({ item: food }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.recentFoodCard}
      onPress={() => handleFoodSelect(food)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${food.calories_per_100g} calories`}
      accessibilityHint="Double tap to quickly log this recent food"
    >
      <View style={styles.recentFoodInfo}>
        <Text style={styles.recentFoodName} numberOfLines={2}>
          {food.name}
        </Text>
        {food.brand && (
          <Text style={styles.recentFoodBrand} numberOfLines={1}>
            {food.brand}
          </Text>
        )}
        <Text style={styles.recentFoodCalories}>
          {food.calories_per_100g} cal
        </Text>
      </View>
      {food.safety_status && (
        <View style={styles.recentFoodSafety}>
          <SafetyTag status={food.safety_status} size="small" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderListHeader = () => {
    if (!searched && recentFoods.length > 0) {
      return (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Foods</Text>
            <Text style={styles.sectionSubtitle}>
              Tap to quickly log a food you've eaten before
            </Text>
          </View>
          <FlatList
            data={recentFoods}
            renderItem={renderRecentFoodItem}
            keyExtractor={(item) => `recent-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentFoodsList}
            style={styles.recentFoodsContainer}
          />
          <View style={styles.divider} />
        </>
      );
    }
    
    if (searched) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Search Results {totalResults > 0 && `(${totalResults})`}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      );
    }
    
    if (searched && searchResults.length > 0 && !hasMore) {
      return (
        <View style={styles.endOfResults}>
          <Text style={styles.endOfResultsText}>End of results</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmptyComponent = () => {
    if (loading) {
      return null;
    }
    
    if (searched && searchResults.length === 0) {
      return (
        <View style={styles.emptyStateWrapper}>
          <EmptyState
            icon={FEATURE_ICONS.search}
            headline="No foods found"
            description="Try a different search term or check your spelling. You can also scan a barcode to find products quickly."
            actionLabel="Scan Barcode"
            onAction={() => (navigation as any).navigate('BarcodeScanner', { mealType })}
          />
        </View>
      );
    }
    
    if (!searched && recentFoods.length === 0) {
      return (
        <View style={styles.emptyStateWrapper}>
          <EmptyState
            icon={FEATURE_ICONS.search}
            headline="Search for foods"
            description="Start typing to find foods and track your nutrition. You can search by name, brand, or category."
          />
        </View>
      );
    }
    
    return null;
  };

  const dataToDisplay = searched ? searchResults : [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <HeaderBar
        title={`Add to ${mealType}`}
        leftAction={{
          icon: FEATURE_ICONS.back,
          onPress: () => navigation.goBack(),
          accessibilityLabel: 'Go back',
        }}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search for food..."
      />

      <FlatList
        data={dataToDisplay}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  section: {
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  recentFoodsContainer: {
    marginBottom: theme.spacing.md,
  },
  recentFoodsList: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  recentFoodCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    width: 140,
    minHeight: 120,
    ...theme.shadows.sm,
    justifyContent: 'space-between',
  },
  recentFoodInfo: {
    flex: 1,
  },
  recentFoodName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recentFoodBrand: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  recentFoodCalories: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 'auto',
  },
  recentFoodSafety: {
    marginTop: theme.spacing.xs,
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
  },
  foodItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
    minHeight: 44,
  },
  foodInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  foodName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  foodBrand: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  foodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  foodCalories: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  servingSize: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    marginLeft: theme.spacing.xs,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingMoreText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  endOfResults: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  endOfResultsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },
  emptyStateWrapper: {
    paddingVertical: theme.spacing.xxl,
  },
});
