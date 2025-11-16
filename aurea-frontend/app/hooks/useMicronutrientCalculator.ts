import { useMemo } from 'react';
import { NutritionSummary, NutritionTargets, MicronutrientData } from '../types';

/**
 * Micronutrient information including importance and food sources
 */
const MICRONUTRIENT_INFO: Record<string, { importance: string; foodSources: string[] }> = {
  folate: {
    importance: 'Critical for preventing neural tube defects and supporting baby\'s brain development',
    foodSources: ['Leafy greens', 'Lentils', 'Fortified cereals', 'Oranges', 'Avocado'],
  },
  iron: {
    importance: 'Essential for preventing anemia and supporting increased blood volume',
    foodSources: ['Red meat', 'Spinach', 'Beans', 'Fortified cereals', 'Tofu'],
  },
  calcium: {
    importance: 'Vital for baby\'s bone and teeth development',
    foodSources: ['Dairy products', 'Fortified plant milk', 'Leafy greens', 'Sardines', 'Tofu'],
  },
  dha: {
    importance: 'Supports baby\'s brain and eye development',
    foodSources: ['Fatty fish (salmon, sardines)', 'DHA-fortified eggs', 'Algae supplements', 'Walnuts'],
  },
  choline: {
    importance: 'Important for baby\'s brain development and neural tube formation',
    foodSources: ['Eggs', 'Chicken', 'Fish', 'Beef', 'Soybeans'],
  },
  vitamin_d: {
    importance: 'Helps absorb calcium and supports immune system',
    foodSources: ['Fatty fish', 'Fortified milk', 'Egg yolks', 'Mushrooms', 'Sunlight exposure'],
  },
  vitamin_b12: {
    importance: 'Essential for nervous system development and red blood cell formation',
    foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy', 'Fortified cereals'],
  },
  magnesium: {
    importance: 'Supports muscle and nerve function, helps prevent leg cramps',
    foodSources: ['Nuts', 'Seeds', 'Whole grains', 'Leafy greens', 'Legumes'],
  },
};

/**
 * Custom hook to calculate micronutrient totals and percentages
 * Extracts micronutrients from nutrition summary and calculates progress
 * Returns formatted data ready for chart display
 */
export const useMicronutrientCalculator = (
  summary: NutritionSummary | null,
  targets: NutritionTargets | null
): MicronutrientData[] => {
  const micronutrients = useMemo(() => {
    if (!summary || !targets) {
      return [];
    }

    const result: MicronutrientData[] = [];

    // Folate
    if (summary.folate_mcg !== undefined && targets.micronutrients.folate_mcg) {
      result.push({
        name: 'Folate',
        current: summary.folate_mcg,
        target: targets.micronutrients.folate_mcg,
        unit: 'mcg',
        importance: MICRONUTRIENT_INFO.folate.importance,
        foodSources: MICRONUTRIENT_INFO.folate.foodSources,
        percentOfTarget: (summary.folate_mcg / targets.micronutrients.folate_mcg) * 100,
      });
    }

    // Iron
    if (summary.iron_mg !== undefined && targets.micronutrients.iron_mg) {
      result.push({
        name: 'Iron',
        current: summary.iron_mg,
        target: targets.micronutrients.iron_mg,
        unit: 'mg',
        importance: MICRONUTRIENT_INFO.iron.importance,
        foodSources: MICRONUTRIENT_INFO.iron.foodSources,
        percentOfTarget: (summary.iron_mg / targets.micronutrients.iron_mg) * 100,
      });
    }

    // Calcium
    if (summary.calcium_mg !== undefined && targets.micronutrients.calcium_mg) {
      result.push({
        name: 'Calcium',
        current: summary.calcium_mg,
        target: targets.micronutrients.calcium_mg,
        unit: 'mg',
        importance: MICRONUTRIENT_INFO.calcium.importance,
        foodSources: MICRONUTRIENT_INFO.calcium.foodSources,
        percentOfTarget: (summary.calcium_mg / targets.micronutrients.calcium_mg) * 100,
      });
    }

    // DHA
    if (summary.dha_mg !== undefined && targets.micronutrients.dha_mg) {
      result.push({
        name: 'DHA',
        current: summary.dha_mg,
        target: targets.micronutrients.dha_mg,
        unit: 'mg',
        importance: MICRONUTRIENT_INFO.dha.importance,
        foodSources: MICRONUTRIENT_INFO.dha.foodSources,
        percentOfTarget: (summary.dha_mg / targets.micronutrients.dha_mg) * 100,
      });
    }

    // Choline
    if (summary.choline_mg !== undefined && targets.micronutrients.choline_mg) {
      result.push({
        name: 'Choline',
        current: summary.choline_mg,
        target: targets.micronutrients.choline_mg,
        unit: 'mg',
        importance: MICRONUTRIENT_INFO.choline.importance,
        foodSources: MICRONUTRIENT_INFO.choline.foodSources,
        percentOfTarget: (summary.choline_mg / targets.micronutrients.choline_mg) * 100,
      });
    }

    // Vitamin D
    if (summary.vitamin_d_mcg !== undefined && targets.micronutrients.vitamin_d_mcg) {
      result.push({
        name: 'Vitamin D',
        current: summary.vitamin_d_mcg,
        target: targets.micronutrients.vitamin_d_mcg,
        unit: 'mcg',
        importance: MICRONUTRIENT_INFO.vitamin_d.importance,
        foodSources: MICRONUTRIENT_INFO.vitamin_d.foodSources,
        percentOfTarget: (summary.vitamin_d_mcg / targets.micronutrients.vitamin_d_mcg) * 100,
      });
    }

    // Vitamin B12
    if (summary.vitamin_b12_mcg !== undefined && targets.micronutrients.vitamin_b12_mcg) {
      result.push({
        name: 'Vitamin B12',
        current: summary.vitamin_b12_mcg,
        target: targets.micronutrients.vitamin_b12_mcg,
        unit: 'mcg',
        importance: MICRONUTRIENT_INFO.vitamin_b12.importance,
        foodSources: MICRONUTRIENT_INFO.vitamin_b12.foodSources,
        percentOfTarget: (summary.vitamin_b12_mcg / targets.micronutrients.vitamin_b12_mcg) * 100,
      });
    }

    // Magnesium
    if (summary.magnesium_mg !== undefined && targets.micronutrients.magnesium_mg) {
      result.push({
        name: 'Magnesium',
        current: summary.magnesium_mg,
        target: targets.micronutrients.magnesium_mg,
        unit: 'mg',
        importance: MICRONUTRIENT_INFO.magnesium.importance,
        foodSources: MICRONUTRIENT_INFO.magnesium.foodSources,
        percentOfTarget: (summary.magnesium_mg / targets.micronutrients.magnesium_mg) * 100,
      });
    }

    return result;
  }, [summary, targets]);

  return micronutrients;
};
