import PostHog from 'posthog-react-native';

import { env } from './env';

/**
 * PostHog product analytics. No-ops when no key is configured (local dev).
 * Free tier is ~1M events/month — plenty for MVP.
 */
let client: PostHog | null = null;

type EventProps = Record<string, string | number | boolean | null>;

export function initAnalytics(): void {
  if (!env.posthogKey || client) return;
  try {
    client = new PostHog(env.posthogKey, {
      host: env.posthogHost,
      // Respect dev builds: don't send analytics while developing.
      disabled: __DEV__,
    });
  } catch (error) {
    console.warn('[larping] PostHog init failed', error);
  }
}

export function identify(userId: string, properties?: EventProps): void {
  client?.identify(userId, properties);
}

export function track(event: string, properties?: EventProps): void {
  client?.capture(event, properties);
}

export function resetAnalytics(): void {
  client?.reset();
}
