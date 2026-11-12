import { getCalendars } from 'expo-localization';

/**
 * The device's IANA timezone (e.g. "Australia/Melbourne"). Stored on the
 * profile and used server-side for streaks and daily resets — times are
 * stored in UTC, streaks are computed in the user's timezone.
 */
export function deviceTimezone(): string {
  try {
    const tz = getCalendars()[0]?.timeZone;
    return tz ?? 'UTC';
  } catch {
    return 'UTC';
  }
}
