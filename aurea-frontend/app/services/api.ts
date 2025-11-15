import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { 
  FoodItem, 
  FoodEntry, 
  SearchResult, 
  NutritionSummary, 
  MealType,
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate,
} from '../types';

// Base API configuration
const API_BASE_URL = 'http://localhost:8000'; // Update with your backend URL

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
    const token = await SecureStore.getItemAsync('auth_token');
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
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      // You can emit an event here to update auth context
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
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

// Food API
export const foodAPI = {
  search: async (query: string, page: number = 1, limit: number = 20): Promise<SearchResult> => {
    const response = await api.get('/food/search', {
      params: { q: query, page, limit },
    });
    return response.data;
  },

  getById: async (foodId: string): Promise<FoodItem> => {
    const response = await api.get(`/food/${foodId}`);
    return response.data;
  },

  logFood: async (foodData: {
    food_id: string;
    quantity: number;
    serving_size: string;
    meal_type: MealType;
  }): Promise<FoodEntry> => {
    const response = await api.post('/food/log', foodData);
    return response.data;
  },

  getFoodEntries: async (date?: string): Promise<FoodEntry[]> => {
    const params = date ? { date } : {};
    const response = await api.get('/food/entries', { params });
    return response.data;
  },

  updateFoodEntry: async (entryId: string, updates: Partial<FoodEntry>): Promise<FoodEntry> => {
    const response = await api.put(`/food/entries/${entryId}`, updates);
    return response.data;
  },

  deleteFoodEntry: async (entryId: string): Promise<void> => {
    await api.delete(`/food/entries/${entryId}`);
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
    const response = await api.get('/nutrition/daily-summary', { params });
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
