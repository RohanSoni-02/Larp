import {
  MAX_STREAK_SHIELDS,
  SHIELD_EARN_EVERY_DAYS,
  STREAK_BONUS_EVERY_DAYS,
} from './constants';

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  /** Local (user-timezone) date of the last activity, "yyyy-MM-dd"; null = never. */
  lastActivityLocalDate: string | null;
  shields: number;
};

export type StreakEvent =
  | { type: 'shield_earned' }
  | { type: 'shield_used'; count: number }
  | { type: 'streak_bonus'; streakDays: number }
  | { type: 'streak_lost'; previousStreak: number };

export type StreakAdvance = { state: StreakState; events: StreakEvent[] };

function addDays(localDate: string, days: number): string {
  // Parse as UTC to keep date math timezone-free; local dates are labels.
  const [y, m, d] = localDate.split('-').map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map((n) => parseInt(n, 10));
  const [ty, tm, td] = to.split('-').map((n) => parseInt(n, 10));
  const a = Date.UTC(fy!, fm! - 1, fd!);
  const b = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Advance a streak given an activity on `todayLocalDate` (the user's local
 * date). Pure: the server runs the same rules inside save_session.
 *
 * Rules: same day = no-op. Consecutive day = +1. Missed days are covered by
 * streak shields (1 shield per missed day, used automatically); without
 * enough shields the streak resets to 1. A shield is earned every 7 streak
 * days (max 2 held). A +25 XP streak bonus fires every 7 streak days.
 */
export function advanceStreak(state: StreakState, todayLocalDate: string): StreakAdvance {
  const events: StreakEvent[] = [];
  const last = state.lastActivityLocalDate;

  if (last === todayLocalDate) {
    return { state, events };
  }

  let { currentStreak, longestStreak, shields } = state;

  if (last === null) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(last, todayLocalDate);
    if (gap <= 0) return { state, events }; // clock weirdness: ignore
    const missed = gap - 1;
    if (missed === 0) {
      currentStreak += 1;
    } else if (shields >= missed) {
      shields -= missed;
      currentStreak += 1;
      events.push({ type: 'shield_used', count: missed });
    } else {
      events.push({ type: 'streak_lost', previousStreak: currentStreak });
      currentStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  if (currentStreak > 1 && currentStreak % SHIELD_EARN_EVERY_DAYS === 0 && shields < MAX_STREAK_SHIELDS) {
    shields += 1;
    events.push({ type: 'shield_earned' });
  }
  if (currentStreak > 1 && currentStreak % STREAK_BONUS_EVERY_DAYS === 0) {
    events.push({ type: 'streak_bonus', streakDays: currentStreak });
  }

  return {
    state: { currentStreak, longestStreak, lastActivityLocalDate: todayLocalDate, shields },
    events,
  };
}

export { addDays as _addDaysForTest };
