import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { env, isSupabaseConfigured } from './env';

/**
 * On a physical device, 127.0.0.1 is the phone itself — the local Supabase on
 * your Mac is unreachable. In dev builds, rewrite a localhost URL to the LAN
 * IP Metro is serving from (same machine). No-ops on web and in release builds.
 */
function resolveSupabaseUrl(url: string): string {
  if (Platform.OS === 'web') return url;
  const hostUri = Constants.expoConfig?.hostUri;
  const metroHost = hostUri?.split(':')[0];
  if (!metroHost) return url;
  return url.replace(/^(https?:\/\/)(127\.0\.0\.1|localhost)(:\d+)?/, `$1${metroHost}$3`);
}

/**
 * Auth token storage: SecureStore for small values, AsyncStorage as fallback
 * (SecureStore values are limited to 2048 bytes, which PKCE verifier chunks
 * can exceed). This is the pattern from Supabase's Expo docs.
 *
 * Expo Router server-renders web pages in Node, where AsyncStorage's web
 * implementation touches `window.localStorage` and crashes. During SSR we
 * return a no-op storage; the real session is restored client-side.
 */
const isServer = typeof window === 'undefined';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (isServer) return Promise.resolve(null);
    return Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (isServer) return Promise.resolve();
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    if (value.length > 2048) return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (isServer) return Promise.resolve();
    return Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  },
};

function makeClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    // Dev mode without a backend: a client pointed at a dead URL. Screens that
    // need data should guard on `isSupabaseConfigured` and show setup hints.
    return createClient('http://127.0.0.1:54321', 'public-anon-key-not-configured', {
      auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: false },
    });
  }
  return createClient(resolveSupabaseUrl(env.supabaseUrl!), env.supabaseAnonKey!, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web' && !isServer,
    },
  });
}

export const supabase = makeClient();
