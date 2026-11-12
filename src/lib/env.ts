import { Platform } from 'react-native';

/**
 * Client-safe environment variables (EXPO_PUBLIC_* are inlined at build time).
 * Secret keys NEVER belong here — service-role keys stay on the server.
 * Static access only: Expo inlines EXPO_PUBLIC_* per reference.
 */
function nonEmpty(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  supabaseUrl: nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  posthogKey: nonEmpty(process.env.EXPO_PUBLIC_POSTHOG_KEY),
  posthogHost: nonEmpty(process.env.EXPO_PUBLIC_POSTHOG_HOST) ?? 'https://us.i.posthog.com',
  googleWebClientId: nonEmpty(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
} as const;

/** True when Supabase is configured; false lets the app boot in a "no backend" dev mode. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export function warnIfMissing(): void {
  if (__DEV__ && !isSupabaseConfigured && Platform.OS !== 'web') {
    console.warn(
      '[larping] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set. ' +
        'Copy .env.example to .env and fill them in to enable the backend.',
    );
  }
}
