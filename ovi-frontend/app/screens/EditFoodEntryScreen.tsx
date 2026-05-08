// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

const NavBar: React.FC<{ title: string; kicker?: string; onBack: () => void; right?: React.ReactNode }> = ({ title, kicker, onBack, right }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[navBarStyles.bar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
      <TouchableOpacity onPress={onBack} style={navBarStyles.backBtn} accessibilityLabel="Go back">
        <MaterialCommunityIcons name="chevron-left" size={20} color="#2B221B" />
      </TouchableOpacity>
      <View style={{ flex: 1, minWidth: 0 }}>
        {kicker && <Text style={navBarStyles.kicker}>{kicker}</Text>}
        <Text style={navBarStyles.title} numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  );
};

const navBarStyles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: '#2B221B',
    letterSpacing: -0.3,
    marginTop: 2,
  },
});
import { SafetyTag } from '../components/ui/SafetyTag';
import { Button } from '../components/ui/Button';
import { NutritionPreview } from '../components/food/NutritionPreview';
import { ServingSizeInput } from '../components/food/ServingSizeInput';
import { SafetyWarningModal } from '../components/modals/SafetyWarningModal';
import { useToast } from '../components/ui/ToastProvider';
import { useCelebrations } from '../hooks/useCelebrations';
import { useFoodEntry } from '../hooks/useFoodEntry';
import { foodAPI } from '../services/api';
import { FoodItem, FoodEntry, MealType } from '../types';
import CelebrationModal from '../components/modals/CelebrationModal';

interface RouteParams {
  food?: FoodItem;
  entry?: FoodEntry;
  mealType?: MealType;
  date?: string;
  isNewEntry?: boolean;
}

/**
 * EditFoodEntryScreen (Refactored)
 * 
 * Modular screen for creating or editing food entries
 * Broken down into reusable components and custom hooks
 */
export const EditFoodEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { showToast } = useToast();
  const { celebrate, dismissCelebration, currentCelebration, showCelebration } = useCelebrations();

  const { food, entry, mealType, date, isNewEntry = false } = route.params as RouteParams;

  // Use custom hook for food entry logic
  const {
    servingSize,
    selectedMealType,
    currentFood,
    setServingSize,
    setSelectedMealType,
    nutrition,
    isValid,
  } = useFoodEntry({ food, entry, mealType });

  const [loading, setLoading] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  useEffect(() => {
    if (currentFood?.safety_status === 'avoid' && isNewEntry) {
      setShowSafetyWarning(true);
    }
  }, [currentFood, isNewEntry]);

  if (!currentFood) {
    return (
      <ScreenWrapper>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleSave = async () => {
    if (loading || !isValid) return;

    // Show safety warning for avoid foods if not already shown
    if (currentFood?.safety_status === 'avoid' && isNewEntry && !showSafetyWarning) {
      setShowSafetyWarning(true);
      return;
    }

    setLoading(true);
    try {
      // Parse serving size to get amount and unit separately
      const match = servingSize.match(/^([\d.]+)\s*(.*)$/);
      if (!match) {
        Alert.alert('Error', 'Invalid serving size format');
        setLoading(false);
        return;
      }

      const servingSizeNum = parseFloat(match[1]);
      const servingUnit = match[2] || 'g';
      const consumedAt = date
        ? (() => {
          const selected = new Date(date);
          const offset = selected.getTimezoneOffset() * 60000;
          const localDate = new Date(selected.getTime() - offset).toISOString().split('T')[0];
          return `${localDate}T12:00:00`;
        })()
        : undefined;

      if (isNewEntry) {
        // Create new food entry
        await foodAPI.logFood({
          food_id: currentFood!.id,
          serving_size: servingSizeNum,
          serving_unit: servingUnit,
          meal_type: selectedMealType,
          consumed_at: consumedAt,
        });
        showToast('Food logged successfully!', 'success');

        // Celebrate first meal logged
        celebrate('first_meal_logged');
      } else if (entry) {
        // Update existing entry
        await foodAPI.updateFoodEntry(entry.id, {
          serving_size: servingSizeNum,
          serving_unit: servingUnit,
          meal_type: selectedMealType,
        });
        showToast('Food entry updated!', 'success');
      }

      // Navigate back
      if (isNewEntry) {
        (navigation as any).navigate('Main', { screen: 'Dashboard', params: { refresh: true, refreshAt: Date.now() } });
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error saving food entry:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 'Failed to save food entry. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSafetyWarningConfirm = () => {
    setShowSafetyWarning(false);
    handleSave();
  };

  const handleDelete = async () => {
    if (!entry) return;

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
              await foodAPI.deleteFoodEntry(entry.id);
              showToast('Entry deleted successfully', 'success');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  // Compute meal label for the CTA button
  const ctaMealLabel = (selectedMealType || 'meal').charAt(0).toUpperCase() + (selectedMealType || 'meal').slice(1);
  const ctaKcal = Math.round(nutrition?.calories || 0);

  return (
    <ScreenWrapper backgroundColor="#F6F1EA">
      <NavBar
        title={currentFood.name.split(',')[0] || (isNewEntry ? 'Food details' : 'Edit entry')}
        kicker={isNewEntry ? 'Food details' : 'Edit entry'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity style={styles.iconCircle} accessibilityLabel="Favorite">
            <MaterialCommunityIcons name="star-outline" size={18} color="#8C7E70" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Food Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroBrand}>
            {currentFood.brand || 'Generic'}{currentFood.serving_unit ? ` · ${currentFood.serving_unit}` : ''}
          </Text>
          <Text style={styles.heroName}>
            {currentFood.name.split(',')[0]}
            {currentFood.name.includes(',') && (
              <Text>
                {','}{'\n'}
                <Text style={styles.heroNameItalic}>{currentFood.name.split(',').slice(1).join(',').trim()}</Text>
              </Text>
            )}
          </Text>

          <View style={styles.heroKcalRow}>
            <Text style={styles.heroKcal}>{Math.round(currentFood.calories_per_100g || 0)}</Text>
            <Text style={styles.heroKcalLabel}>kcal per serving</Text>
          </View>

          {nutrition && (
            <View style={styles.macroBars}>
              {[
                { label: 'PROT', value: Math.round(nutrition.protein || 0), color: '#B84C3F', wash: '#F4E4DF' },
                { label: 'CARB', value: Math.round(nutrition.carbs || 0), color: '#D19B4E', wash: '#F5EAD7' },
                { label: 'FATS', value: Math.round(nutrition.fat || 0), color: '#8A9A7B', wash: '#E9EEE2' },
              ].map(m => (
                <View key={m.label} style={{ flex: 1 }}>
                  <View style={[styles.macroBarTrack, { backgroundColor: m.wash }]}>
                    <View style={{ width: '60%', height: '100%', backgroundColor: m.color, borderRadius: 2 }} />
                  </View>
                  <View style={styles.macroValueRow}>
                    <Text style={styles.macroValue}>{m.value}g</Text>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {currentFood.safety_status && (
            <View style={{ marginTop: 14 }}>
              <SafetyTag status={currentFood.safety_status} size="small" />
            </View>
          )}
        </View>

        {/* Meal Type chip selector */}
        <Text style={styles.sectionLabel}>Meal</Text>
        <View style={styles.mealChipRow}>
          {mealTypes.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[styles.mealChip, selectedMealType === value && styles.mealChipSelected]}
              onPress={() => setSelectedMealType(value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${label}${selectedMealType === value ? ', selected' : ''}`}
            >
              <Text style={[styles.mealChipText, selectedMealType === value && styles.mealChipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Serving */}
        <Text style={styles.sectionLabel}>Serving</Text>
        <View style={styles.servingCard}>
          <ServingSizeInput value={servingSize} onChange={setServingSize} />
        </View>

        {/* Nutrition preview */}
        <Text style={styles.sectionLabel}>Nutrition facts</Text>
        <View style={styles.nutritionCardWrap}>
          <NutritionPreview nutrition={nutrition} />
        </View>

        {/* Delete (edit mode only) */}
        {!isNewEntry && entry && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete food entry"
          >
            <Text style={styles.deleteButtonText}>Delete entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Sticky save CTA */}
      <View style={[styles.stickyCta, { bottom: safeBottom + 82 }]}>
        <TouchableOpacity
          style={[styles.primaryCta, (!isValid || loading) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={!isValid || loading}
          accessibilityRole="button"
          accessibilityLabel={isNewEntry ? 'Log food' : 'Update entry'}
        >
          <Text style={styles.primaryCtaText}>
            {loading
              ? 'Saving…'
              : (
                <>
                  {isNewEntry ? 'Add to ' : 'Update '}
                  <Text style={styles.primaryCtaTextItalic}>{ctaMealLabel}</Text>
                  <Text style={styles.primaryCtaTextMute}>  + {ctaKcal} kcal</Text>
                </>
              )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Safety Warning Modal */}
      <SafetyWarningModal
        visible={showSafetyWarning}
        foodName={currentFood.name}
        safetyNotes={currentFood.safety_notes}
        onConfirm={handleSafetyWarningConfirm}
        onCancel={() => setShowSafetyWarning(false)}
      />

      {/* Celebration Modal */}
      {currentCelebration && (
        <CelebrationModal
          visible={showCelebration}
          title={currentCelebration.title}
          message={currentCelebration.message}
          onDismiss={dismissCelebration}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: '#2B221B',
    padding: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#FDFAF6',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 20,
    marginBottom: 16,
  },
  heroBrand: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroName: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: '#2B221B',
    letterSpacing: -0.6,
    lineHeight: 30,
    marginTop: 6,
  },
  heroNameItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  heroKcalRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroKcal: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 36,
    color: '#2B221B',
    letterSpacing: -1,
  },
  heroKcalLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
  },
  macroBars: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  macroBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
  },
  macroLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#8C7E70',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 10,
    marginTop: 6,
  },
  mealChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mealChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  mealChipSelected: {
    backgroundColor: '#B84C3F',
    borderColor: '#B84C3F',
  },
  mealChipText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: '#2B221B',
  },
  mealChipTextSelected: {
    color: '#FFFFFF',
  },
  servingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 8,
    marginBottom: 16,
  },
  nutritionCardWrap: {
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#B84C3F',
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: '#5A4D42',
    marginBottom: 16,
  },
  stickyCta: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  primaryCta: {
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  primaryCtaTextItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  primaryCtaTextMute: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
