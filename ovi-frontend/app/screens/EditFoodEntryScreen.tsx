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
import { HeaderBar } from '../components/layout/HeaderBar';
import { theme } from '../theme';
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

  const { food, entry, mealType, isNewEntry = false } = route.params as RouteParams;

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

      if (isNewEntry) {
        // Create new food entry
        await foodAPI.logFood({
          food_id: currentFood!.id,
          serving_size: servingSizeNum,
          serving_unit: servingUnit,
          meal_type: selectedMealType,
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
        (navigation as any).navigate('Dashboard', { refresh: true });
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

  return (
    <ScreenWrapper>
      <HeaderBar
        title={isNewEntry ? 'Log Food' : 'Edit Entry'}
        showBack
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: 'content-save',
            onPress: handleSave,
            color: loading || !isValid ? theme.colors.text.muted : theme.colors.primary,
            accessibilityLabel: loading ? 'Saving...' : 'Save food entry',
          },
        ]}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Food Info */}
        <View style={styles.foodInfo}>
          <View style={styles.foodHeader}>
            <MaterialCommunityIcons
              name="food-apple"
              size={theme.iconSize.lg}
              color={theme.colors.primary}
              style={styles.foodNameIcon}
            />
            <View style={styles.foodTitleContainer}>
              <Text style={styles.foodName}>{currentFood.name}</Text>
              {currentFood.brand && (
                <Text style={styles.foodBrand}>{currentFood.brand}</Text>
              )}
            </View>
            {currentFood.safety_status && (
              <SafetyTag status={currentFood.safety_status} size="small" />
            )}
          </View>
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
    paddingBottom: theme.spacing.xxxl,
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
