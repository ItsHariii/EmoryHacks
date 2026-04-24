import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // We throw to fail fast in dev if auth is invoked without config.
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or app.json extra).'
  );
}

const createStub = () => {
  const err = new Error(
    'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
  return {
    auth: {
      signInWithOAuth: async () => {
        throw err;
      },
      exchangeCodeForSession: async () => {
        throw err;
      },
      setSession: async () => {
        throw err;
      },
      refreshSession: async () => {
        throw err;
      },
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => {
        // no-op
      },
    },
  } as any;
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // RN often lacks `crypto.subtle`, so PKCE falls back to `plain` and can break OAuth (blank web view).
          // Implicit returns tokens in the callback URL hash; see `completeSupabaseOAuthFromCallbackUrl`.
          flowType: 'implicit',
          // We'll handle the redirect flow manually with AuthSession / WebBrowser.
          detectSessionInUrl: false,
          autoRefreshToken: true,
          persistSession: true,
        },
      })
    : createStub();

