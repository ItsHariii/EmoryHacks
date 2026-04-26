// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { EmptyState } from '../components/ui/EmptyState';
import { FloatingChatbot } from '../components/chat/FloatingChatbot';
import { theme } from '../theme';
import { checkFoodSafety } from '../utils/foodSafetyHelper';
import { FoodSafetyBadge } from '../components/food/FoodSafetyBadge';
import { foodAPI } from '../services/api';
import { FoodItem, MealType } from '../types';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

interface RouteParams {
  mealType?: MealType;
  date?: string;
}

const RECENT_SEARCHES = ['Greek yogurt', 'Avocado toast', 'Salmon fillet', 'Lentil soup', 'Almond butter'];

export const SearchFoodScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { mealType = 'breakfast', date } = (route.params as RouteParams) || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (searchQuery.trim()) {
      debounceTimer.current = setTimeout(() => handleSearch(), 300);
    } else {
      setSearchResults([]);
      setSearched(false);
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  const loadRecentFoods = async () => {
    try {
      const recent = await foodAPI.getRecentFoods(10);
      setRecentFoods(recent);
    } catch (error) {
      setRecentFoods([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchError(false);
    try {
      const results = await foodAPI.search(searchQuery.trim());
      const enrichedFoods = results.foods.map(food => {
        const safety = checkFoodSafety(food.name);
        if (safety) return { ...food, safety_status: safety.status, safety_notes: safety.reason };
        return food;
      });
      setSearchResults(enrichedFoods);
      setSearched(true);
      setTotalResults(results.total);
    } catch (error) {
      setSearchResults([]);
      setSearched(true);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = useCallback((food: FoodItem) => {
    (navigation as any).navigate('EditFoodEntry', {
      food,
      mealType,
      date,
      isNewEntry: true,
    });
  }, [navigation, mealType, date]);

  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  const renderFoodRow = ({ item: food, last }: { item: FoodItem; last?: boolean }) => (
    <TouchableOpacity
      style={[styles.foodRow, !last && styles.foodRowDivider]}
      onPress={() => handleFoodSelect(food)}
      activeOpacity={0.7}
      accessibilityLabel={`${food.name}, ${food.calories_per_100g} calories per 100 grams`}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
        <Text style={styles.foodMeta} numberOfLines={1}>
          {food.brand || 'Generic'} ·{' '}
          <Text style={styles.foodMetaTnum}>
            {food.serving_size && food.serving_unit
              ? `${food.serving_size}${food.serving_unit}`
              : '100g'}
          </Text>
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.foodKcal}>{Math.round(food.calories_per_100g)}</Text>
        <Text style={styles.foodKcalLabel}>KCAL</Text>
      </View>
      <View style={styles.addCircle}>
        <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
      </View>
      {food.safety_status && (
        <View style={{ marginLeft: 8 }}>
          <FoodSafetyBadge status={food.safety_status} notes={food.safety_notes} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      {/* NavBar */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="chevron-left" size={20} color="#2B221B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navKicker}>Adding to {mealLabel}</Text>
          <Text style={styles.navTitle}>Find a food</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9C8E80" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search foods..."
            placeholderTextColor="#9C8E80"
            autoFocus
          />
          <TouchableOpacity accessibilityLabel="Voice search">
            <MaterialCommunityIcons name="microphone-outline" size={18} color="#9C8E80" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={searched ? searchResults : []}
        renderItem={({ item, index }) => renderFoodRow({ item, last: index === searchResults.length - 1 })}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {!searched && (
              <>
                <Text style={styles.sectionLabel}>Recent searches</Text>
                <View style={styles.chipsWrap}>
                  {RECENT_SEARCHES.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={styles.recentChip}
                      onPress={() => setSearchQuery(r)}
                    >
                      <MaterialCommunityIcons name="magnify" size={11} color="#9C8E80" />
                      <Text style={styles.recentChipText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {recentFoods.length > 0 && (
                  <>
                    <View style={styles.sectionLabelRow}>
                      <Text style={styles.sectionLabel}>Frequently logged</Text>
                    </View>
                    <View style={styles.card}>
                      {recentFoods.map((f, i) => (
                        <View key={f.id}>
                          {renderFoodRow({ item: f, last: i === recentFoods.length - 1 })}
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            {searched && (
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>Results</Text>
                <Text style={styles.sectionMeta}>{totalResults > 0 ? `${totalResults} matches` : ''}</Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          searched && searchResults.length === 0 && !loading ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              {searchError ? (
                <EmptyState
                  icon={FEATURE_ICONS.search}
                  headline="Search failed"
                  description="Could not connect to the food database."
                />
              ) : (
                <EmptyState
                  icon={FEATURE_ICONS.search}
                  headline="No foods found"
                  description="Try a different search term or scan a barcode."
                  actionLabel="Scan Barcode"
                  onAction={() => (navigation as any).navigate('BarcodeScanner', { mealType })}
                />
              )}
            </View>
          ) : null
        }
        renderItem={({ item, index }) =>
          searched ? (
            <View style={index === 0 ? styles.cardOpen : styles.cardMid}>
              {renderFoodRow({ item, last: index === searchResults.length - 1 })}
            </View>
          ) : null
        }
      />

      {/* Manual entry CTA */}
      <View style={styles.manualEntryWrap}>
        <View style={styles.manualEntry}>
          <View style={{ flex: 1 }}>
            <Text style={styles.manualTitle}>Can't find it?</Text>
            <Text style={styles.manualSub}>Add a custom food</Text>
          </View>
          <TouchableOpacity style={styles.manualCta} onPress={() => (navigation as any).navigate('EditFoodEntry', { mealType, date, isNewEntry: true, food: null })}>
            <Text style={styles.manualCtaText}>Add manually</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#B84C3F" />
        </View>
      )}

      <FloatingChatbot bottom={120} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  navBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  navTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: '#2B221B',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: '#2B221B',
    padding: 0,
  },
  listContent: {
    paddingBottom: 180,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
  },
  sectionMeta: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
    paddingHorizontal: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  recentChip: {
    backgroundColor: '#EFE7DC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentChipText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: '#6A5D52',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardOpen: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  cardMid: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  foodRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0E8DC',
  },
  foodName: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#2B221B',
    lineHeight: 18,
  },
  foodMeta: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
    marginTop: 3,
  },
  foodMetaTnum: {
    fontVariant: ['tabular-nums'],
  },
  foodKcal: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
  },
  foodKcalLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 9,
    color: '#9C8E80',
    letterSpacing: 0.6,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B84C3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualEntryWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
  },
  manualEntry: {
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E8E0D5',
    borderRadius: 16,
    backgroundColor: '#F6F1EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
  },
  manualSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#6A5D52',
    marginTop: 2,
  },
  manualCta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#2B221B',
  },
  manualCtaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});
