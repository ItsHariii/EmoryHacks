// @ts-nocheck
import { useState, useMemo } from 'react';
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
  const [servingSize, setServingSize] = useState(() => {
    const raw = entry?.serving_size ?? food?.serving_size ?? '100g';
    return typeof raw === 'string' ? raw : `${raw}g`;
  });
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

  const nutrition = useMemo<NutritionData | null>(() => {
    if (!currentFood || !servingSize) return null;

    const match = servingSize.match(/^([\d.]+)\s*(.*)$/);
    if (!match) return null;

    const amount = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (isNaN(amount) || amount <= 0) return null;

    let gramsMultiplier = 1;

    switch (unit) {
      case 'g':
      case 'gram':
      case 'grams':
        gramsMultiplier = amount / 100;
        break;
      case 'mg':
      case 'milligram':
      case 'milligrams':
        gramsMultiplier = amount / 100000;
        break;
      case 'oz':
      case 'ounce':
      case 'ounces':
        gramsMultiplier = (amount * 28.35) / 100;
        break;
      case 'cup':
      case 'cups':
        gramsMultiplier = (amount * 240) / 100;
        break;
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons':
        gramsMultiplier = (amount * 15) / 100;
        break;
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons':
        gramsMultiplier = (amount * 5) / 100;
        break;
      case 'ml':
      case 'milliliter':
      case 'milliliters':
        gramsMultiplier = amount / 100;
        break;
      case 'serving':
      case 'servings': {
        const servingSizeGrams = currentFood.serving_size_grams || 100;
        gramsMultiplier = (amount * servingSizeGrams) / 100;
        break;
      }
      default:
        gramsMultiplier = amount / 100;
    }

    const baseCalories = currentFood.calories_per_100g || 0;
    return {
      calories: Math.round(baseCalories * gramsMultiplier),
      protein: Math.round((currentFood.protein_per_100g || 0) * gramsMultiplier),
      carbs: Math.round((currentFood.carbs_per_100g || 0) * gramsMultiplier),
      fat: Math.round((currentFood.fat_per_100g || 0) * gramsMultiplier),
    };
  }, [currentFood, servingSize]);

  const isValid = useMemo<boolean>(() => {
    if (!currentFood || !servingSize) return false;
    const match = servingSize.match(/^([\d.]+)\s*(.*)$/);
    if (!match) return false;
    const amount = parseFloat(match[1]);
    return !isNaN(amount) && amount > 0;
  }, [currentFood, servingSize]);

  return {
    servingSize,
    selectedMealType,
    currentFood,
    setServingSize,
    setSelectedMealType,
    nutrition,
    isValid,
  };
};
