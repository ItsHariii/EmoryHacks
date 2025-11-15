import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../theme';
import { SafetyTag } from '../components/SafetyTag';
import { foodAPI } from '../services/api';
import { FoodItem, FoodEntry, MealType } from '../types';

interface RouteParams {
  food?: FoodItem;
  entry?: FoodEntry;
  mealType?: MealType;
  isNewEntry?: boolean;
}

export const EditFoodEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { food, entry, mealType, isNewEntry = false } = route.params as RouteParams;

  const [quantity, setQuantity] = useState(entry?.quantity?.toString() || '1');
  const [servingSize, setServingSize] = useState(entry?.serving_size || food?.serving_size || '100g');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    entry?.meal_type || mealType || 'breakfast'
  );
  const [loading, setLoading] = useState(false);

  const currentFood = food || (entry ? {
    id: entry.food_id,
    name: entry.food_name,
    calories_per_100g: entry.calories_logged / (entry.quantity || 1),
  } as FoodItem : null);

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
      } else if (entry) {
        // Update existing entry
        await foodAPI.updateFoodEntry(entry.id, {
          quantity: quantityNum,
          serving_size: servingSize,
          meal_type: selectedMealType,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving food entry:', error);
      Alert.alert('Error', 'Failed to save food entry. Please try again.');
    } finally {
      setLoading(false);
    }
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
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
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
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serving Size</Text>
            <TextInput
              style={styles.input}
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="100g"
              placeholderTextColor={theme.colors.text.muted}
            />
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
    color: theme.colors.text.light,
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
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  deleteButton: {
    backgroundColor: theme.colors.error,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
