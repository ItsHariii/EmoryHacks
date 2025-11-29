import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../theme';
import { SafetyTag } from '../components/SafetyTag';
import { Button } from '../components/Button';
import { useToast } from '../components/ToastProvider';
import { useCelebrations } from '../hooks/useCelebrations';
import { foodAPI } from '../services/api';
import { FoodItem, FoodEntry, MealType } from '../types';
import CelebrationModal from '../components/CelebrationModal';

interface RouteParams {
  food?: FoodItem;
  entry?: FoodEntry;
  mealType?: MealType;
  isNewEntry?: boolean;
}

export const EditFoodEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { celebrate, dismissCelebration, currentCelebration, showCelebration } = useCelebrations();
  const { food, entry, mealType, isNewEntry = false } = route.params as RouteParams;

  const [quantity, setQuantity] = useState(entry?.quantity?.toString() || '1');
  const [servingSize, setServingSize] = useState(entry?.serving_size || food?.serving_size || '100g');
  const [customServingSize, setCustomServingSize] = useState('');
  const [showCustomServing, setShowCustomServing] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    entry?.meal_type || mealType || 'breakfast'
  );
  const [loading, setLoading] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  const currentFood = food || (entry ? {
    id: entry.food_id,
    name: entry.food_name,
    calories_per_100g: entry.calories_logged / (entry.quantity || 1),
  } as FoodItem : null);

  // Check if food should show safety warning on mount
  useEffect(() => {
    if (currentFood?.safety_status === 'avoid' && isNewEntry) {
      setShowSafetyWarning(true);
    }
  }, [currentFood, isNewEntry]);

  // Common serving size options
  const servingSizeOptions = [
    { label: '1 cup', value: '1 cup' },
    { label: '1 serving', value: '1 serving' },
    { label: '100g', value: '100g' },
    { label: 'Custom', value: 'custom' },
  ];

  const handleServingSizeSelect = (value: string) => {
    if (value === 'custom') {
      setShowCustomServing(true);
      setServingSize('');
    } else {
      setShowCustomServing(false);
      setServingSize(value);
    }
  };

  const handleCustomServingSizeChange = (value: string) => {
    setCustomServingSize(value);
    setServingSize(value);
  };

  const incrementQuantity = () => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseFloat(quantity) || 0;
    if (current > 1) {
      setQuantity((current - 1).toString());
    }
  };

  const calculateNutrition = () => {
    if (!currentFood || !quantity) return null;

    const multiplier = parseFloat(quantity) || 0;
    const baseCalories = currentFood.calories_per_100g || 0;
    
    // Simple calculation - in real app, this would use serving size conversion
    const calories = Math.round(baseCalories * multiplier);
    const protein = Math.round((currentFood.protein_per_100g || 0) * multiplier);
    const carbs = Math.round((currentFood.carbs_per_100g || 0) * multiplier);
    const fat = Math.round((currentFood.fat_per_100g || 0) * multiplier);

    return { calories, protein, carbs, fat };
  };

  const handleSave = async () => {
    if (!currentFood || !quantity || !servingSize) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    // Show safety warning for avoid foods if not already shown
    if (currentFood.safety_status === 'avoid' && isNewEntry && !showSafetyWarning) {
      setShowSafetyWarning(true);
      return;
    }

    setLoading(true);
    try {
      if (isNewEntry) {
        // Create new food entry
        await foodAPI.logFood({
          food_id: currentFood.id,
          quantity: quantityNum,
          serving_size: servingSize,
          meal_type: selectedMealType,
        });
        showToast('Food logged successfully!', 'success');
        
        // Celebrate first meal logged
        celebrate('first_meal_logged');
      } else if (entry) {
        // Update existing entry
        await foodAPI.updateFoodEntry(entry.id, {
          quantity: quantityNum,
          serving_size: servingSize,
          meal_type: selectedMealType,
        });
        showToast('Food entry updated!', 'success');
      }

      // Navigate back to Dashboard or FoodLogging screen
      // Use navigate to ensure Dashboard refreshes
      if (isNewEntry) {
        (navigation as any).navigate('Dashboard', { refresh: true });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving food entry:', error);
      showToast('Failed to save food entry. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSafetyWarningConfirm = () => {
    setShowSafetyWarning(false);
    // Proceed with save after confirmation
    handleSave();
  };

  const handleSafetyWarningCancel = () => {
    setShowSafetyWarning(false);
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
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const nutrition = calculateNutrition();

  if (!currentFood) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Food data not available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isNewEntry ? 'Add Food' : 'Edit Entry'}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isNewEntry ? 'Save food entry' : 'Update food entry'}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{currentFood.name}</Text>
          {currentFood.brand && (
            <Text style={styles.foodBrand}>{currentFood.brand}</Text>
          )}
          {currentFood.safety_status && (
            <View style={styles.safetyContainer}>
              <SafetyTag status={currentFood.safety_status} />
            </View>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serving Size</Text>
            <View style={styles.servingSizeOptions}>
              {servingSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.servingSizeButton,
                    (showCustomServing && option.value === 'custom') || 
                    (!showCustomServing && servingSize === option.value)
                      ? styles.servingSizeButtonActive
                      : null,
                  ]}
                  onPress={() => handleServingSizeSelect(option.value)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option.label} serving size`}
                  accessibilityState={{ 
                    selected: (showCustomServing && option.value === 'custom') || 
                              (!showCustomServing && servingSize === option.value)
                  }}
                >
                  <Text
                    style={[
                      styles.servingSizeButtonText,
                      (showCustomServing && option.value === 'custom') || 
                      (!showCustomServing && servingSize === option.value)
                        ? styles.servingSizeButtonTextActive
                        : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {showCustomServing && (
              <TextInput
                style={[styles.input, { marginTop: theme.spacing.sm }]}
                value={customServingSize}
                onChangeText={handleCustomServingSizeChange}
                placeholder="e.g., 1 slice, 2 oz"
                placeholderTextColor={theme.colors.text.muted}
                accessible={true}
                accessibilityLabel="Custom serving size"
                accessibilityHint="Enter your custom serving size"
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.quantityAdjuster}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
                disabled={parseFloat(quantity) <= 1}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={theme.colors.text.muted}
                accessible={true}
                accessibilityLabel="Quantity"
                accessibilityHint="Enter the number of servings"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.quantityHelper}>
              {servingSize && `${quantity} × ${servingSize}`}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal</Text>
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
        </View>

        {nutrition && (
          <View style={styles.nutritionPreview}>
            <Text style={styles.nutritionTitle}>Nutrition Preview</Text>
            {currentFood.safety_status && (
              <View style={styles.safetyPreview}>
                <SafetyTag status={currentFood.safety_status} />
                {currentFood.safety_notes && (
                  <Text style={styles.safetyNotes}>{currentFood.safety_notes}</Text>
                )}
              </View>
            )}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
            <Text style={styles.nutritionHelper}>
              Based on {quantity} × {servingSize || '100g'}
            </Text>
          </View>
        )}

        {!isNewEntry && entry && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Safety Warning Modal */}
      <Modal
        visible={showSafetyWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSafetyWarningCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Safety Notice</Text>
              <SafetyTag status="avoid" />
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                This food is generally recommended to avoid during pregnancy.
              </Text>
              
              {currentFood?.safety_notes && (
                <View style={styles.safetyNotesBox}>
                  <Text style={styles.safetyNotesTitle}>Important Information:</Text>
                  <Text style={styles.safetyNotesText}>{currentFood.safety_notes}</Text>
                </View>
              )}
              
              <Text style={styles.modalFooterText}>
                We recommend consulting with your healthcare provider before consuming this food. 
                Would you still like to log it?
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={handleSafetyWarningCancel}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Log Anyway"
                onPress={handleSafetyWarningConfirm}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  foodInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  safetyContainer: {
    alignItems: 'flex-start',
  },
  form: {
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text.primary,
  },
  servingSizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  servingSizeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  servingSizeButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  servingSizeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  servingSizeButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  quantityAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  quantityButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.bold,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: theme.fontWeight.semibold,
  },
  quantityHelper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  pickerContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  picker: {
    height: 50,
  },
  nutritionPreview: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  nutritionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  safetyPreview: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  safetyNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  nutritionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  nutritionHelper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalBody: {
    marginBottom: theme.spacing.lg,
  },
  modalText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  safetyNotesBox: {
    backgroundColor: theme.colors.accentLight,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  safetyNotesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  safetyNotesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.fontSize.sm,
  },
  modalFooterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.fontSize.sm,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
