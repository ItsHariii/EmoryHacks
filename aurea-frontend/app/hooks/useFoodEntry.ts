import { useState, useCallback } from 'react';
import { FoodItem, FoodEntry, MealType } from '../types';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UseFoodEntryProps {
  food?: FoodItem;
  entry?: FoodEntry;
  mealType?: MealType;
}

/**
 * useFoodEntry Hook
 * 
 * Manages food entry form state and calculations
 */
export const useFoodEntry = ({ food, entry, mealType }: UseFoodEntryProps) => {
  const [servingSize, setServingSize] = useState(
    entry?.serving_size || food?.serving_size || '100g'
  );
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    entry?.meal_type || mealType || 'breakfast'
  );

  const currentFood = food || (entry ? {
    id: entry.food_id,
    name: entry.food_name,
    calories_per_100g: entry.calories_logged / (entry.quantity || 1),
    safety_status: entry.food?.safety_status,
    safety_notes: entry.food?.safety_notes,
  } as FoodItem : null);

  const calculateNutrition = useCallback((): NutritionData | null => {
    if (!currentFood || !servingSize) return null;

    // Parse serving size (e.g., "100g", "1cup", "85g")
    const match = servingSize.match(/^([\d.]+)\s*(.*)$/);
    if (!match) return null;

    const amount = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (isNaN(amount) || amount <= 0) return null;

    // Convert to grams multiplier based on unit
    let gramsMultiplier = 1;
    
    switch (unit) {
      case 'g':
      case 'gram':
      case 'grams':
        gramsMultiplier = amount / 100; // Base nutrition is per 100g
        break;
      case 'mg':
      case 'milligram':
      case 'milligrams':
        gramsMultiplier = amount / 100000; // Convert mg to g, then divide by 100
        break;
      case 'oz':
      case 'ounce':
      case 'ounces':
        gramsMultiplier = (amount * 28.35) / 100; // 1 oz = 28.35g
        break;
      case 'cup':
      case 'cups':
        gramsMultiplier = (amount * 240) / 100; // Approximate: 1 cup = 240g
        break;
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons':
        gramsMultiplier = (amount * 15) / 100; // 1 tbsp = 15g
        break;
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons':
        gramsMultiplier = (amount * 5) / 100; // 1 tsp = 5g
        break;
      case 'ml':
      case 'milliliter':
      case 'milliliters':
        gramsMultiplier = amount / 100; // Approximate: 1ml ≈ 1g for most liquids
        break;
      case 'serving':
      case 'servings':
        // Use the food's serving size if available, otherwise assume 100g per serving
        const servingSizeGrams = currentFood.serving_size_grams || 100;
        gramsMultiplier = (amount * servingSizeGrams) / 100;
        break;
      default:
        gramsMultiplier = amount / 100; // Default to grams
    }

    const baseCalories = currentFood.calories_per_100g || 0;
    const calories = Math.round(baseCalories * gramsMultiplier);
    const protein = Math.round((currentFood.protein_per_100g || 0) * gramsMultiplier);
    const carbs = Math.round((currentFood.carbs_per_100g || 0) * gramsMultiplier);
    const fat = Math.round((currentFood.fat_per_100g || 0) * gramsMultiplier);

    return { calories, protein, carbs, fat };
  }, [currentFood, servingSize]);

  const validateForm = useCallback((): boolean => {
    if (!currentFood || !servingSize) {
      return false;
    }

    // Parse serving size to validate
    const match = servingSize.match(/^([\d.]+)\s*(.*)$/);
    if (!match) return false;

    const amount = parseFloat(match[1]);
    if (isNaN(amount) || amount <= 0) {
      return false;
    }

    return true;
  }, [currentFood, servingSize]);

  return {
    // State
    servingSize,
    selectedMealType,
    currentFood,

    // Setters
    setServingSize,
    setSelectedMealType,

    // Computed
    nutrition: calculateNutrition(),
    isValid: validateForm(),
  };
};
