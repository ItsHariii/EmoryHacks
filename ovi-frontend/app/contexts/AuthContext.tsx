import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authAPI, userAPI } from '../services/api';
import { User } from '../types';

// Helper functions for secure storage that work on all platforms
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use AsyncStorage on web (less secure but functional)
      await AsyncStorage.setItem(key, value);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

interface RegistrationData {
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await secureStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        // Verify token is still valid by fetching current user
        try {
          // We need to set the token in axios headers manually here since the interceptor 
          // might not have picked it up yet or we want to be explicit
          const userProfile = await userAPI.getCurrentUser();
          setUser(userProfile);
          // Update stored user data with fresh data
          await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
        } catch (error) {
          console.log('Token validation failed, logging out');
          // Token invalid or expired
          await logout();
        }
      } else {
        // No token or user data, ensure clean state
        await logout();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, refresh_token } = response;

      // Store the token
      await secureStorage.setItem('auth_token', access_token);
      if (refresh_token) {
        await secureStorage.setItem('refresh_token', refresh_token);
      }

      // Fetch user profile after login
      const userProfile = await userAPI.getCurrentUser();
      await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      setUser(userProfile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      // Register the user with all the data
      const userResponse = await authAPI.register(data);

      // After registration, log them in to get a token
      await login(data.email, data.password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to call logout API, but don't block local cleanup if it fails
      try {
        await authAPI.logout();
      } catch (e) {
        console.log('Logout API call failed, proceeding with local cleanup');
      }

      await secureStorage.deleteItem('auth_token');
      await secureStorage.deleteItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure local state is cleared even if storage fails
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userProfile = await userAPI.getCurrentUser();
      await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      setUser(userProfile);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const existingRefreshToken = await secureStorage.getItem('refresh_token');
      if (!existingRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refresh(existingRefreshToken);
      const { access_token, refresh_token: newRefreshToken } = response;

      await secureStorage.setItem('auth_token', access_token);
      if (newRefreshToken) {
        await secureStorage.setItem('refresh_token', newRefreshToken);
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      // If refresh fails, log the user out to ensure a clean state
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
