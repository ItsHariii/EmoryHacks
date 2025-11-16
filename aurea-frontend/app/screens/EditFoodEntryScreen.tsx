import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../theme';
import { SafetyTag } from '../components/SafetyTag';
import { Button } from '../components/Button';
import { ServingSizeInput } from '../components/ServingSizeInput';
import { NutritionPreview } from '../components/NutritionPreview';
import { SafetyWarningModal } from '../components/SafetyWarningModal';
import { useToast } from '../components/ToastProvider';
import { useCelebrations } from '../hooks/useCelebrations';
import { useFoodEntry } from '../hooks/useFoodEntry';
import { foodAPI } from '../services/api';
import { FoodItem, FoodEntry, MealType } from '../types';
import CelebrationModal from '../components/CelebrationModal';

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
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if food should show safety warning on mount
  useEffect(() => {
    if (currentFood?.safety_status === 'avoid' && isNewEntry) {
      setShowSafetyWarning(true);
    }
  }, [currentFood, isNewEntry]);

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

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
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Food not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {isNewEntry ? 'Log Food' : 'Edit Entry'}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading || !isValid}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save food entry"
        >
          <Text
            style={[
              styles.saveButtonText,
              (!isValid || loading) && styles.saveButtonTextDisabled,
            ]}
          >
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Food Info */}
        <View style={styles.foodInfo}>
          <View style={styles.foodHeader}>
            <View style={styles.foodTitleContainer}>
              <Text style={styles.foodName}>{currentFood.name}</Text>
              {currentFood.brand && (
                <Text style={styles.foodBrand}>{currentFood.brand}</Text>
              )}
            </View>
            {currentFood.safety_status && (
              <SafetyTag status={currentFood.safety_status} />
            )}
          </View>
        </View>

        {/* Meal Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meal Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedMealType}
              onValueChange={setSelectedMealType}
              style={styles.picker}
            >
              <Picker.Item label="Breakfast" value="breakfast" />
              <Picker.Item label="Lunch" value="lunch" />
              <Picker.Item label="Dinner" value="dinner" />
              <Picker.Item label="Snack" value="snack" />
            </Picker>
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
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent,
    flex: 2,
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    color: theme.colors.accent,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  saveButtonTextDisabled: {
    color: theme.colors.text.muted,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  foodInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  foodName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  foodBrand: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  customServingInput: {
    marginTop: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  saveButtonLarge: {
    marginTop: theme.spacing.md,
  },
  deleteButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
});
