export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dueDate?: string;
  trimester?: number;
  babies?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  serving_size?: string;
  serving_unit?: string;
  safety_status?: 'safe' | 'limited' | 'avoid';
  safety_notes?: string;
}

export interface FoodEntry {
  id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  serving_size: string;
  meal_type: MealType;
  calories_logged: number;
  protein_logged?: number;
  carbs_logged?: number;
  fat_logged?: number;
  fiber_logged?: number;
  logged_at: string;
  safety_status?: 'safe' | 'limited' | 'avoid';
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionSummary {
  date: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g?: number;
  sodium_mg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  vitamin_a_mcg?: number;
  vitamin_c_mg?: number;
  vitamin_d_mcg?: number;
  folate_mcg?: number;
  vitamin_b12_mcg?: number;
  magnesium_mg?: number;
  dha_mg?: number;
  choline_mg?: number;
}

export interface NutritionTargets {
  calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  micronutrients: {
    fiber_g: number;
    calcium_mg: number;
    iron_mg: number;
    folate_mcg: number;
    vitamin_d_mcg: number;
    vitamin_c_mg: number;
    vitamin_a_mcg: number;
    vitamin_b12_mcg: number;
    magnesium_mg: number;
    dha_mg: number;
    choline_mg: number;
  };
  water_ml: number;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SearchResult {
  foods: FoodItem[];
  total: number;
  page: number;
  limit: number;
}

// Journal and Mood Tracking Types
export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;  // ISO date string
  symptoms: string[];
  mood: number;  // 1-5
  cravings: string;
  sleep_quality: number;  // 1-5
  energy_level: number;  // 1-5
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  entry_date: string;
  symptoms?: string[];
  mood?: number;
  cravings?: string;
  sleep_quality?: number;
  energy_level?: number;
  notes?: string;
}

export interface JournalEntryUpdate {
  symptoms?: string[];
  mood?: number;
  cravings?: string;
  sleep_quality?: number;
  energy_level?: number;
  notes?: string;
}

// Pregnancy Week and Progress Types
export interface PregnancyInfo {
  week: number;
  trimester: number;
  daysUntilDue: number;
  daysPassed: number;
  weekTip: string;
  trimesterName: string;
}

// Micronutrient Tracking Types
export interface MicronutrientTarget {
  name: string;
  current: number;
  target: number;
  unit: string;
  importance: string;
}

export interface MicronutrientData {
  name: string;
  current: number;
  target: number;
  unit: string;
  importance: string;
  foodSources: string[];
  percentOfTarget: number;
}

// Notification Types
export interface NotificationPreferences {
  enabled: boolean;
  hydration: {
    enabled: boolean;
    intervalHours: number;
  };
  supplements: {
    enabled: boolean;
    time: string;
    name: string;
  };
  meals: {
    enabled: boolean;
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}

export interface ScheduledNotification {
  id: string;
  type: 'hydration' | 'supplement' | 'meal';
  title: string;
  body: string;
  trigger: Date | { hour: number; minute: number; repeats: boolean };
}

// Barcode Scanning Types
export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  serving_size?: string;
  nutrients: {
    energy_100g: number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
}

// Offline Sync Types
export interface PendingAction {
  id: string;
  type: 'food_log' | 'journal_entry' | 'profile_update';
  timestamp: number;
  data: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}
