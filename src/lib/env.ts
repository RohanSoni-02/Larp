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
  /** Public web origin for links that leave the app (emails, shared invites). */
  siteUrl: (nonEmpty(process.env.EXPO_PUBLIC_SITE_URL) ?? 'https://larpr-app.vercel.app').replace(/\/+$/, ''),
} as const;

/**
 * Absolute https URL to a page of the web app. In the browser it stays on the
 * current origin (so local dev and previews link back to themselves); native
 * builds link to the hosted site, because `larpr://` and `exp://` deep links
 * only open on a device that has the app (or the dev server) running.
 *
 * Auth emails only honour URLs on the Supabase redirect allow-list (Auth → URL
 * Configuration); anything else falls back to the project's Site URL.
 */
export function siteLink(path: string, query?: Record<string, string | null | undefined>): string {
  const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : env.siteUrl;
  const url = new URL(path, `${origin}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value != null) url.searchParams.set(key, value);
  }
  return url.toString();
}

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
