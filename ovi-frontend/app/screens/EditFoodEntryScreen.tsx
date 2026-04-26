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
    color: '#9C8E80',
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

  // Early return if no food data
  if (!currentFood) {
    return (
      <ScreenWrapper>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Check if food should show safety warning on mount
  useEffect(() => {
    if (currentFood?.safety_status === 'avoid' && isNewEntry) {
      setShowSafetyWarning(true);
    }
  }, [currentFood, isNewEntry]);

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
        (navigation as any).navigate('Dashboard', { refresh: true, refreshAt: Date.now() });
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

  if (!currentFood) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Food not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </ScreenWrapper>
    );
  }

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
            <MaterialCommunityIcons name="star-outline" size={18} color="#9C8E80" />
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

        {/* Meal Type Selector - Chip Pills */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meal Type</Text>
          <View style={styles.mealChipRow}>
            {mealTypes.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.mealChip,
                  selectedMealType === value && styles.mealChipSelected,
                ]}
                onPress={() => setSelectedMealType(value)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${label}${selectedMealType === value ? ', selected' : ''}`}
              >
                <Text
                  style={[
                    styles.mealChipText,
                    selectedMealType === value && styles.mealChipTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Serving Size Input */}
        <View style={styles.section}>
          <ServingSizeInput
            value={servingSize}
            onChange={setServingSize}
          />
        </View>

        {/* Nutrition Preview */}
        <NutritionPreview nutrition={nutrition} />

        {/* Save Button */}
        <Button
          title={isNewEntry ? 'Log Food' : 'Update Entry'}
          onPress={handleSave}
          loading={loading}
          disabled={!isValid}
          style={styles.saveButtonLarge}
        />

        {/* Delete Button (Edit Mode Only) */}
        {!isNewEntry && entry && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete food entry"
          >
            <Text style={styles.deleteButtonText}>Delete Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    padding: theme.layout.screenPadding,
    paddingBottom: 100, // Extra space to clear floating tab bar (70px height + 20px margin)
  },
  foodInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.layout.cardPadding,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodNameIcon: {
    marginRight: theme.spacing.md,
  },
  foodTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  foodName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  foodBrand: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  mealChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  mealChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.chip,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  mealChipSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  mealChipText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  mealChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  customServingInput: {
    marginTop: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  saveButtonLarge: {
    marginTop: theme.spacing.lg,
    ...theme.shadows.md,
  },
  deleteButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
    ...theme.shadows.sm,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.layout.screenPadding,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
});
