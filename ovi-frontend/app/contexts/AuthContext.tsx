import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { authAPI, userAPI } from '../services/api';
import { User } from '../types';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../services/supabase';
import { completeSupabaseOAuthFromCallbackUrl } from '../services/supabaseOAuth';
import { openSupabaseOAuthBrowser } from '../services/oauthBrowser';

// Expo Go uses `exp://<host>/--/…`; a standalone / dev-client build uses the
// native `ovi://` scheme registered in `app.json`. `makeRedirectUri` handles
// both correctly when we pass the right inputs.
const isExpoGo = Constants.appOwnership === 'expo';

function getOAuthRedirectUri(): string {
  return isExpoGo
    ? AuthSession.makeRedirectUri({ path: 'auth/callback' })
    : AuthSession.makeRedirectUri({ scheme: 'ovi', path: 'auth/callback' });
}

WebBrowser.maybeCompleteAuthSession();

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
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
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
        // No token or user data — just ensure a clean local state. Do NOT hit
        // the server logout endpoint here; we have no credentials to send and
        // it would just 401 noisily on every cold start.
        await clearLocalAuthState();
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
      await secureStorage.setItem('auth_provider', 'legacy');

      // Fetch user profile after login
      const userProfile = await userAPI.getCurrentUser();
      await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      setUser(userProfile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      const redirectUri = getOAuthRedirectUri();

      if (__DEV__) {
        console.log(
          '[OAuth] appOwnership:',
          Constants.appOwnership,
          '| isExpoGo:',
          isExpoGo
        );
        console.log(
          '[OAuth] redirectUri (must be allowlisted in Supabase):',
          redirectUri
        );
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Missing OAuth URL');

      // Register a Linking listener BEFORE opening the browser so we never
      // miss the callback URL on Android emulators. On emulators, Chrome
      // Custom Tabs sometimes routes the ovi:// redirect as a plain activity
      // intent (firing Linking) instead of through expo-web-browser's native
      // redirect activity (which resolves openAuthSessionAsync directly).
      let linkingSub: ReturnType<typeof Linking.addEventListener> | null = null;
      const linkingCallbackPromise = new Promise<string>((resolve) => {
        linkingSub = Linking.addEventListener('url', ({ url }) => {
          if (url.includes('auth/callback')) {
            resolve(url);
          }
        });
      });

      let callbackUrl: string;
      try {
        const result = await openSupabaseOAuthBrowser(data.url, redirectUri);

        if (__DEV__) {
          console.log('[OAuth] browser result.type:', result.type);
        }

        if (result.type === 'success') {
          callbackUrl = result.url;
          if (__DEV__) {
            console.log('[OAuth] callback URL via openAuthSession');
          }
        } else {
          // Android fallback — Chrome Custom Tabs sometimes routes the
          // ovi:// redirect via Linking instead of expo-web-browser's native
          // redirect activity. Wait briefly for that Linking event.
          const linkingUrl = await Promise.race([
            linkingCallbackPromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
          ]);
          if (!linkingUrl) {
            throw new Error('OAuth sign-in cancelled');
          }
          callbackUrl = linkingUrl;
          if (__DEV__) {
            console.log('[OAuth] callback URL via Linking fallback');
          }
        }
      } finally {
        // Remove listener only after result/fallback handling is complete.
        linkingSub?.remove();
      }

      const { session, error: sessionError } = await completeSupabaseOAuthFromCallbackUrl(
        callbackUrl
      );
      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error('Supabase session missing access token');
      }

      await secureStorage.setItem('auth_token', session.access_token);
      if (session.refresh_token) {
        await secureStorage.setItem('refresh_token', session.refresh_token);
      }
      await secureStorage.setItem('auth_provider', 'supabase');

      const userProfile = await userAPI.getCurrentUser();
      await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      setUser(userProfile);
    } catch (error) {
      console.error('OAuth login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => loginWithOAuth('google');
  const loginWithApple = async () => loginWithOAuth('apple');

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

  const clearLocalAuthState = async () => {
    try {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore Supabase signOut errors; local cleanup is authoritative.
      }
      await secureStorage.deleteItem('auth_token');
      await secureStorage.deleteItem('refresh_token');
      await secureStorage.deleteItem('auth_provider');
      await AsyncStorage.removeItem('user_data');
    } finally {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      // Only hit the server logout endpoint if we actually have a token —
      // otherwise it just 401s and spams the logs on every cold start.
      const existingToken = await secureStorage.getItem('auth_token');
      if (existingToken) {
        try {
          await authAPI.logout();
        } catch (e) {
          if (__DEV__) {
            console.log('Logout API call failed, proceeding with local cleanup');
          }
        }
      }

      await clearLocalAuthState();
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

      const provider = await secureStorage.getItem('auth_provider');
      if (provider === 'supabase') {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: existingRefreshToken,
        });
        if (error) throw error;
        if (!data.session?.access_token) {
          throw new Error('Supabase refresh missing access token');
        }
        await secureStorage.setItem('auth_token', data.session.access_token);
        if (data.session.refresh_token) {
          await secureStorage.setItem('refresh_token', data.session.refresh_token);
        }
      } else {
        const response = await authAPI.refresh(existingRefreshToken);
        const { access_token, refresh_token: newRefreshToken } = response;

        await secureStorage.setItem('auth_token', access_token);
        if (newRefreshToken) {
          await secureStorage.setItem('refresh_token', newRefreshToken);
        }
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
    loginWithGoogle,
    loginWithApple,
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
