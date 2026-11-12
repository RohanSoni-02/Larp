/**
 * Gamification rules — single source of truth on the client.
 * These constants are mirrored by the Postgres functions (save_session etc.)
 * and pinned to the same values by tests on both sides. Never trust the
 * client's copy for writes: the server recomputes everything.
 */

export const TIERS = [
  { name: 'Larping', hours: 0, nodes: 0 },
  { name: 'Apprentice', hours: 5, nodes: 2 },
  { name: 'Adept', hours: 25, nodes: 6 },
  { name: 'Legit', hours: 100, nodes: 12 },
] as const;

export const TIER_NAMES = TIERS.map((t) => t.name);

/** XP rules */
export const XP_PER_MINUTE = 1;
export const XP_MIN_PER_SESSION = 5;
export const XP_NODE_LANDED = 50;
export const XP_STREAK_BONUS = 25;
export const STREAK_BONUS_EVERY_DAYS = 7;
export const XP_LARP_CHECK_ON_TIME = 10;
export const DAILY_XP_CAP = 240;

/** Streaks */
export const MAX_STREAK_SHIELDS = 2;
export const SHIELD_EARN_EVERY_DAYS = 7;

/** Skill trees */
export const DEFAULT_SESSIONS_TO_LAND = 5;

/** RPG class tie-break order (from the prototype). */
export const CLASS_ORDER = [
  'piano',
  'guitar',
  'calisthenics',
  'drawing',
  'candle',
  'pottery',
  'baking',
  'spanish',
  'penspin',
] as const;
