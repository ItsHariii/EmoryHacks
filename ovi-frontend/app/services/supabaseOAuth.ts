/**
 * Completes Supabase OAuth after expo-web-browser returns to the app.
 * Supports PKCE (?code=) and implicit grant (#access_token=...) redirects.
 */
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

function getQueryParam(url: string, key: string): string | null {
  const qStart = url.indexOf('?');
  if (qStart === -1) return null;
  const fragmentStart = url.indexOf('#', qStart);
  const query =
    fragmentStart === -1 ? url.slice(qStart + 1) : url.slice(qStart + 1, fragmentStart);
  try {
    return new URLSearchParams(query).get(key);
  } catch {
    return null;
  }
}

function parseImplicitFragment(url: string): {
  access_token: string;
  refresh_token: string;
} | null {
  const hashIdx = url.indexOf('#');
  if (hashIdx === -1) return null;
  const params = new URLSearchParams(url.slice(hashIdx + 1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    return { access_token, refresh_token };
  }
  return null;
}

export async function completeSupabaseOAuthFromCallbackUrl(
  callbackUrl: string
): Promise<{ session: Session | null; error: Error | null }> {
  const code = getQueryParam(callbackUrl, 'code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { session: null, error: error as Error };
    }
    return { session: data.session ?? null, error: null };
  }

  const implicit = parseImplicitFragment(callbackUrl);
  if (implicit) {
    const { data, error } = await supabase.auth.setSession({
      access_token: implicit.access_token,
      refresh_token: implicit.refresh_token,
    });
    if (error) {
      return { session: null, error: error as Error };
    }
    return { session: data.session ?? null, error: null };
  }

  const errDesc = getQueryParam(callbackUrl, 'error_description');
  const err = getQueryParam(callbackUrl, 'error');
  if (err || errDesc) {
    return {
      session: null,
      error: new Error(errDesc || err || 'OAuth error in callback URL'),
    };
  }

  return {
    session: null,
    error: new Error('No OAuth code or tokens found in callback URL'),
  };
}
