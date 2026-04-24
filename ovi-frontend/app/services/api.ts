import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from './supabase';
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
  ChatMessage,
  ChatResponse,
  ChatSaveResponse,
} from '../types';
import { invalidateNutritionCache } from '../utils/cacheInvalidation';

const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_PROVIDER_KEY = 'auth_provider';

// Helper for secure token storage that works on all platforms
const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }
};

const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }
};

const getAuthProvider = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(AUTH_PROVIDER_KEY);
  } else {
    return await SecureStore.getItemAsync(AUTH_PROVIDER_KEY);
  }
};

const setAuthToken = async (token: string | null): Promise<void> => {
  if (!token) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }
    return;
  }

  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  }
};

const setRefreshToken = async (token: string | null): Promise<void> => {
  if (!token) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    return;
  }

  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  }
};

const deleteAuthToken = async (): Promise<void> => {
  await setAuthToken(null);
};

const deleteRefreshToken = async (): Promise<void> => {
  await setRefreshToken(null);
};

const deleteAuthProvider = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
  } else {
    await SecureStore.deleteItemAsync(AUTH_PROVIDER_KEY);
  }
};

// Sanitize backend error messages to avoid leaking internals to the UI.
const SAFE_DETAIL_PATTERNS = [
  /invalid (email|password|credentials)/i,
  /email (already|not) (registered|found|exists)/i,
  /account.*locked/i,
  /too many (requests|attempts)/i,
  /food not found/i,
  /journal entry not found/i,
  /could not (save|create|update|delete)/i,
];

const UNSAFE_PATTERNS = [
  /database/i,
  /column/i,
  /table/i,
  /query/i,
  /sqlalchemy/i,
  /traceback/i,
  /exception/i,
];

export function sanitizeApiError(error: any, fallback = 'Something went wrong. Please try again.'): string {
  const detail: string = error?.response?.data?.detail || error?.message || '';
  if (!detail) return fallback;
  const isSafe = SAFE_DETAIL_PATTERNS.some(p => p.test(detail));
  const isUnsafe = UNSAFE_PATTERNS.some(p => p.test(detail));
  if (isSafe && !isUnsafe) return detail;
  if (isUnsafe) return fallback;
  // Short messages without internal jargon are fine to surface
  if (detail.length < 120 && !isUnsafe) return detail;
  return fallback;
}

// Base API configuration
// Automatically detect emulator vs physical device
import { getApiBaseUrl } from '../config/env';

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
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let refreshFailed = false;
let refreshPromise: Promise<void> | null = null;

const clearTokens = async () => {
  await deleteAuthToken();
  await deleteRefreshToken();
  await deleteAuthProvider();
  await AsyncStorage.removeItem('user_data');
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // A successful response resets the refresh-failed flag
    refreshFailed = false;
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    const status = error.response?.status;
    const url: string | undefined = originalRequest.url;

    const isAuthPath =
      url?.includes('/auth/login') ||
      url?.includes('/auth/register') ||
      url?.includes('/auth/refresh');

    if (status === 401 && !isAuthPath && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a previous refresh attempt already failed this session, bail immediately
      if (refreshFailed) {
        await clearTokens();
        return Promise.reject(error);
      }

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = (async () => {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const provider = await getAuthProvider();
            if (provider === 'supabase') {
              const { data, error } = await supabase.auth.refreshSession({
                refresh_token: refreshToken,
              });
              if (error) throw error;
              if (!data.session?.access_token) {
                throw new Error('Supabase refresh missing access token');
              }
              await setAuthToken(data.session.access_token);
              if (data.session.refresh_token) {
                await setRefreshToken(data.session.refresh_token);
              }
            } else {
              const response = await api.post('/auth/refresh', {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token: newRefreshToken } = response.data;

              await setAuthToken(access_token);
              if (newRefreshToken) {
                await setRefreshToken(newRefreshToken);
              }
            }
          })();
        }

        await refreshPromise;

        isRefreshing = false;
        refreshPromise = null;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshFailed = true;
        refreshPromise = null;

        // Refresh failed — clear all tokens so the app can prompt re-login
        await clearTokens();

        return Promise.reject(refreshError);
      }
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

  register: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    due_date?: string;
    babies?: number;
    pre_pregnancy_weight?: number;
    height?: number;
    current_weight?: number;
    blood_type?: string;
    allergies?: string[];
    conditions?: string[];
    dietary_preferences?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
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
    pre_pregnancy_weight: number;
    height: number;
    current_weight: number;
    blood_type: string;
    allergies: string[];
    conditions: string[];
    dietary_preferences: string;
    onboarding_completed: boolean;
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
      page,
      limit,
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

  askChatbot: async (question: string): Promise<{
    answer: string;
    nutrition_data: any;
    food_items: string[];
    sources: string[];
    error?: string;
  }> => {
    const response = await api.post('/food/chatbot', { question });
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
    const response = await api.post('/food/safety-check', {
      query: foodName,
      analyze_as_recipe: false
    });

    // The endpoint returns a full response with ingredients array
    // Extract the overall safety info
    const data = response.data;
    return {
      safety_status: data.overall_safety_status || 'safe',
      safety_notes: data.safety_summary || '',
    };
  },
};

// Photo Analysis API
export const photoAPI = {
  analyzePhoto: async (imageUri: string): Promise<any> => {
    const formData = new FormData();

    // Append the image file
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food.jpg',
    } as any);

    const response = await api.post('/food/analyze-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout for AI analysis
    });

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
      throw new Error(sanitizeApiError(error, 'Failed to create journal entry'));
    }
  },

  getJournalEntries: async (startDate?: string, endDate?: string): Promise<JournalEntry[]> => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/journal/entries', { params });
      // Backend returns { entries: [...], total: number }; normalize to always return an array
      const raw = response.data?.entries ?? response.data;
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to fetch journal entries'));
    }
  },

  getJournalEntry: async (entryId: string): Promise<JournalEntry> => {
    try {
      const response = await api.get(`/journal/entries/${entryId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to fetch journal entry'));
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
      throw new Error(sanitizeApiError(error, 'Failed to update journal entry'));
    }
  },

  deleteJournalEntry: async (entryId: string): Promise<void> => {
    try {
      await api.delete(`/journal/entries/${entryId}`);
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to delete journal entry'));
    }
  },

  // Wellness Chatbot endpoints
  sendChatMessage: async (
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<ChatResponse> => {
    try {
      const response = await api.post('/journal/chat', {
        message,
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to send chat message'));
    }
  },

  saveChatConversation: async (
    conversationHistory: ChatMessage[],
    entryDate?: string
  ): Promise<ChatSaveResponse> => {
    try {
      const response = await api.post('/journal/chat/save', {
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
        entry_date: entryDate || new Date().toISOString().split('T')[0],
      });
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to save conversation'));
    }
  },

  getChatHistory: async (date: string): Promise<{ summary: string; entry: JournalEntry }> => {
    try {
      const response = await api.get(`/journal/chat/history/${date}`);
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to fetch chat history'));
    }
  },

  logWeight: async (weight: number, date: string): Promise<any> => {
    try {
      const response = await api.post('/journal/weight', { weight, date });
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeApiError(error, 'Failed to log weight'));
    }
  },
};

export default api;
