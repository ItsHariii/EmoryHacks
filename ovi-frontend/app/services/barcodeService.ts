// @ts-nocheck
import { FoodItem } from '../types';
import { foodAPI } from './api';

/**
 * Lookup product by barcode through the backend.
 *
 * The backend handles Open Food Facts integration, caching (per source TTL),
 * the layered pregnancy safety pipeline, and per-user allergen checks.
 * The previous client-side OFF call + in-memory Map cache was bypassing
 * all of that, so it's been replaced with a single backend hop.
 */
export const lookupBarcode = async (barcode: string): Promise<FoodItem | null> => {
  const code = (barcode || '').trim();
  if (!isValidBarcodeFormat(code)) {
    return null;
  }

  try {
    const data = await foodAPI.lookupBarcode(code);
    if (!data) {
      return null;
    }

    // Map the backend response shape to the FoodItem the UI expects.
    return {
      id: data.id,
      name: data.name,
      brand: data.brand,
      calories_per_100g: Math.round(data.calories || 0),
      protein_per_100g: data.protein || 0,
      carbs_per_100g: data.carbs || 0,
      fat_per_100g: data.fat || 0,
      fiber_per_100g: data.fiber,
      sugar_per_100g: data.sugar,
      sodium_per_100g: (data.micronutrients?.sodium?.amount) || 0,
      serving_size: data.serving_size?.toString(),
      serving_unit: data.serving_unit,
      safety_status: data.safety_status,
      safety_notes: data.safety_notes,
      safety_verdict: data.safety_verdict,
      allergen_hits: data.allergen_hits || [],
      ingredients: data.ingredients || [],
      allergens: data.allergens || [],
      barcode: data.off_id || code,
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Barcode lookup error:', error);
    throw new Error('Failed to lookup barcode. Please try again.');
  }
};

/**
 * Validate barcode format (UPC-A, UPC-E, EAN-8, EAN-13, GTIN-14).
 */
export const isValidBarcodeFormat = (barcode: string): boolean => {
  const cleaned = (barcode || '').trim();
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  const length = cleaned.length;
  return length === 8 || length === 12 || length === 13 || length === 14;
};

/**
 * Kept as a no-op for backward compatibility — backend now owns caching.
 */
export const clearBarcodeCache = (): void => {};

export default {
  lookupBarcode,
  clearBarcodeCache,
  isValidBarcodeFormat,
};
