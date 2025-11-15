import axios from 'axios';
import { FoodItem, BarcodeProduct } from '../types';

// OpenFoodFacts API configuration
const OPENFOODFACTS_API = 'https://world.openfoodfacts.org/api/v0/product';

// Cache for barcode lookups to reduce API calls
const barcodeCache = new Map<string, BarcodeProduct | null>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name: string;
    brands?: string;
    nutriments?: {
      energy_100g?: number;
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      fiber_100g?: number;
      sugars_100g?: number;
      sodium_100g?: number;
    };
    serving_size?: string;
    serving_quantity?: number;
  };
}

/**
 * Query OpenFoodFacts API for product information by barcode
 */
const queryOpenFoodFacts = async (barcode: string): Promise<BarcodeProduct | null> => {
  try {
    const response = await axios.get<OpenFoodFactsResponse>(
      `${OPENFOODFACTS_API}/${barcode}.json`,
      { timeout: 5000 }
    );

    if (response.data.status === 1 && response.data.product) {
      const product = response.data.product;
      const nutriments = product.nutriments || {};

      // Extract energy value (prefer kcal over kJ)
      const energy = nutriments['energy-kcal_100g'] || 
                     (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0);

      return {
        barcode,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || undefined,
        serving_size: product.serving_size || `${product.serving_quantity || 100}g`,
        nutrients: {
          energy_100g: energy,
          proteins_100g: nutriments.proteins_100g || 0,
          carbohydrates_100g: nutriments.carbohydrates_100g || 0,
          fat_100g: nutriments.fat_100g || 0,
          fiber_100g: nutriments.fiber_100g,
          sugars_100g: nutriments.sugars_100g,
          sodium_100g: nutriments.sodium_100g,
        },
      };
    }

    return null;
  } catch (error) {
    console.error('OpenFoodFacts API error:', error);
    return null;
  }
};

/**
 * Transform BarcodeProduct to FoodItem format
 */
const transformToFoodItem = (product: BarcodeProduct): FoodItem => {
  return {
    id: `barcode_${product.barcode}`,
    name: product.name,
    brand: product.brand,
    calories_per_100g: Math.round(product.nutrients.energy_100g),
    protein_per_100g: product.nutrients.proteins_100g,
    carbs_per_100g: product.nutrients.carbohydrates_100g,
    fat_per_100g: product.nutrients.fat_100g,
    fiber_per_100g: product.nutrients.fiber_100g,
    sugar_per_100g: product.nutrients.sugars_100g,
    sodium_per_100g: product.nutrients.sodium_100g,
    serving_size: product.serving_size,
    serving_unit: 'g',
  };
};

/**
 * Lookup product by barcode with caching
 */
export const lookupBarcode = async (barcode: string): Promise<FoodItem | null> => {
  // Check cache first
  if (barcodeCache.has(barcode)) {
    const cached = barcodeCache.get(barcode);
    if (cached) {
      return transformToFoodItem(cached);
    }
    return null;
  }

  try {
    // Query OpenFoodFacts API
    const product = await queryOpenFoodFacts(barcode);

    // Cache the result (even if null to avoid repeated failed lookups)
    barcodeCache.set(barcode, product);

    // Set cache expiry
    setTimeout(() => {
      barcodeCache.delete(barcode);
    }, CACHE_EXPIRY);

    if (product) {
      return transformToFoodItem(product);
    }

    return null;
  } catch (error) {
    console.error('Barcode lookup error:', error);
    throw new Error('Failed to lookup barcode. Please try again.');
  }
};

/**
 * Clear the barcode cache
 */
export const clearBarcodeCache = (): void => {
  barcodeCache.clear();
};

/**
 * Validate barcode format (UPC-A, UPC-E, EAN-8, EAN-13)
 */
export const isValidBarcodeFormat = (barcode: string): boolean => {
  // Remove any whitespace
  const cleaned = barcode.trim();
  
  // Check if it's numeric
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  // Check length for supported formats
  const length = cleaned.length;
  return length === 8 || length === 12 || length === 13 || length === 14;
};

export default {
  lookupBarcode,
  clearBarcodeCache,
  isValidBarcodeFormat,
};
