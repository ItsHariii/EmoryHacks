import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { 
  FoodItem, 
  FoodEntry, 
  SearchResult, 
  NutritionSummary,
  NutritionTargets,
  MealType,
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate,
} from '../types';
import { invalidateNutritionCache } from '../utils/cacheInvalidation';

// Helper for secure token storage that works on all platforms
const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem('auth_token');
  } else {
    return await SecureStore.getItemAsync('auth_token');
  }
};

const deleteAuthToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem('auth_token');
  } else {
    await SecureStore.deleteItemAsync('auth_token');
  }
};

// Base API configuration
// Automatically detect emulator vs physical device
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  
  if (Platform.OS === 'ios') {
    // iOS Simulator uses localhost
    return 'http://localhost:8000';
  }
  
  if (Platform.OS === 'android') {
    // Check if running on emulator or physical device
    // Android emulators typically have 'generic' or 'sdk' in the device name
    const isEmulator = Platform.constants?.Brand === 'generic' || 
                       Platform.constants?.Model?.includes('sdk') ||
                       Platform.constants?.Model?.includes('Emulator');
    
    if (isEmulator) {
      // Android Emulator: 10.0.2.2 is the special alias to host machine's localhost
      return 'http://10.0.2.2:8000';
    } else {
      // Physical Android device: use localhost (requires adb reverse tcp:8000 tcp:8000)
      return 'http://localhost:8000';
    }
  }
  
  // Fallback
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await deleteAuthToken();
      await AsyncStorage.removeItem('user_data');
      // You can emit an event here to update auth context
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    // OAuth2 expects form data with username/password fields
    const params = new URLSearchParams();
    params.append('username', email);  // OAuth2 uses 'username' field
    params.append('password', password);
    
    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },
};

// User API
export const userAPI = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateCurrentUser: async (updates: Partial<{
    first_name: string;
    last_name: string;
    due_date: string;
    babies: number;
  }>) => {
    const response = await api.patch('/users/me', updates);
    return response.data;
  },

  getNutritionTargets: async () => {
    const response = await api.get('/users/nutrition-targets');
    return response.data;
  },
};

// Food API
export const foodAPI = {
  search: async (query: string, page: number = 1, limit: number = 20): Promise<SearchResult> => {
    const response = await api.get('/food/search', {
      params: { query },
    });
    // Backend returns array of FoodSearchResult, transform to match FoodItem interface
    const rawFoods = Array.isArray(response.data) ? response.data : [];
    const foods = rawFoods.map((item: any) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      calories_per_100g: item.calories || 0,
      protein_per_100g: item.protein || 0,
      carbs_per_100g: item.carbs || 0,
      fat_per_100g: item.fat || 0,
      fiber_per_100g: item.fiber || 0,
      sugar_per_100g: item.sugar || 0,
      sodium_per_100g: item.sodium || 0,
      serving_size: item.serving_size?.toString(),
      serving_unit: item.serving_unit,
      safety_status: item.safety_status,
      safety_notes: item.safety_notes,
    }));
    return {
      foods,
      total: foods.length,
    };
  },

  getById: async (foodId: string): Promise<FoodItem> => {
    const response = await api.get(`/food/${foodId}`);
    return response.data;
  },

  logFood: async (foodData: {
    food_id: string;
    serving_size: number;
    serving_unit: string;
    meal_type: MealType;
  }): Promise<FoodEntry> => {
    const response = await api.post('/food/log', foodData);
    // Invalidate nutrition cache so dashboard updates
    await invalidateNutritionCache();
    return response.data;
  },

  getFoodEntries: async (date?: string): Promise<FoodEntry[]> => {
    const params = date ? { date } : {};
    const response = await api.get('/food/log', { params });
    return response.data;
  },

  updateFoodEntry: async (entryId: string, updates: Partial<FoodEntry>): Promise<FoodEntry> => {
    const response = await api.patch(`/food/log/${entryId}`, updates);
    // Invalidate nutrition cache so dashboard updates
    await invalidateNutritionCache();
    return response.data;
  },

  deleteFoodEntry: async (entryId: string): Promise<void> => {
    await api.delete(`/food/log/${entryId}`);
    // Invalidate nutrition cache so dashboard updates
    await invalidateNutritionCache();
  },

  getRecentFoods: async (limit: number = 10): Promise<FoodItem[]> => {
    const response = await api.get('/food/recent', { params: { limit } });
    return response.data;
  },
};

// Nutrition API
export const nutritionAPI = {
  getDailySummary: async (date?: string): Promise<NutritionSummary> => {
    const params = date ? { date } : {};
    const response = await api.get('/food/nutrition-summary', { params });
    return response.data;
  },

  getWeeklySummary: async (startDate: string): Promise<NutritionSummary[]> => {
    const response = await api.get('/nutrition/weekly-summary', {
      params: { start_date: startDate },
    });
    return response.data;
  },
};

// Safety API
export const safetyAPI = {
  checkFood: async (foodName: string): Promise<{
    safety_status: 'safe' | 'caution' | 'avoid';
    safety_notes: string;
  }> => {
    const response = await api.post('/food/safety-check', { food_name: foodName });
    return response.data;
  },
};

// Journal API
export const journalAPI = {
  createJournalEntry: async (entryData: JournalEntryCreate): Promise<JournalEntry> => {
    try {
      const response = await api.post('/journal/entries', entryData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create journal entry');
    }
  },

  getJournalEntries: async (startDate?: string, endDate?: string): Promise<JournalEntry[]> => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/journal/entries', { params });
      // Backend returns { entries: [...], total: number }
      return response.data.entries || response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to fetch journal entries');
    }
  },

  getJournalEntry: async (entryId: string): Promise<JournalEntry> => {
    try {
      const response = await api.get(`/journal/entries/${entryId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to fetch journal entry');
    }
  },

  updateJournalEntry: async (
    entryId: string, 
    updates: JournalEntryUpdate
  ): Promise<JournalEntry> => {
    try {
      const response = await api.put(`/journal/entries/${entryId}`, updates);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update journal entry');
    }
  },

  deleteJournalEntry: async (entryId: string): Promise<void> => {
    try {
      await api.delete(`/journal/entries/${entryId}`);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to delete journal entry');
    }
  },
};

export default api;
