import { XP_MIN_PER_SESSION, XP_PER_MINUTE, DAILY_XP_CAP } from './constants';

/** Base XP for a session: 1 XP per minute, minimum 5 per session. */
export function sessionBaseXP(durationSeconds: number): number {
  const minutes = Math.floor(durationSeconds / 60);
  return Math.max(minutes * XP_PER_MINUTE, XP_MIN_PER_SESSION);
}

/**
 * Apply the daily anti-farming cap. Returns how much of `amount` may still be
 * awarded given how much XP was already earned today (0 when the cap is hit).
 */
export function applyDailyCap(
  earnedToday: number,
  amount: number,
  cap: number = DAILY_XP_CAP,
): number {
  const remaining = Math.max(0, cap - Math.max(0, earnedToday));
  return Math.min(Math.max(0, amount), remaining);
}
