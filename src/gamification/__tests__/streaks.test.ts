import { advanceStreak, type StreakState } from '../streaks';

const base: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityLocalDate: null,
  shields: 0,
};

describe('advanceStreak', () => {
  it('starts at 1 on the first ever activity', () => {
    const { state } = advanceStreak(base, '2026-11-07');
    expect(state.currentStreak).toBe(1);
    expect(state.lastActivityLocalDate).toBe('2026-11-07');
  });

  it('is a no-op for a second activity the same day', () => {
    const once = advanceStreak(base, '2026-11-07').state;
    const twice = advanceStreak(once, '2026-11-07');
    expect(twice.state.currentStreak).toBe(1);
    expect(twice.events).toHaveLength(0);
  });

  it('increments on consecutive days and tracks the longest streak', () => {
    let s = advanceStreak(base, '2026-11-01').state;
    s = advanceStreak(s, '2026-11-02').state;
    s = advanceStreak(s, '2026-11-03').state;
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('earns a shield and a streak bonus every 7 days', () => {
    let s = advanceStreak(base, '2026-11-01').state;
    const events = [];
    for (let d = 2; d <= 7; d += 1) {
      const r = advanceStreak(s, `2026-11-0${d}`);
      s = r.state;
      events.push(...r.events);
    }
    expect(s.currentStreak).toBe(7);
    expect(s.shields).toBe(1);
    expect(events).toContainEqual({ type: 'shield_earned' });
    expect(events).toContainEqual({ type: 'streak_bonus', streakDays: 7 });
  });

  it('a shield covers one missed day automatically', () => {
    let s = advanceStreak(base, '2026-11-01').state;
    for (let d = 2; d <= 7; d += 1) s = advanceStreak(s, `2026-11-0${d}`).state;
    expect(s.shields).toBe(1);
    // Skip the 8th, practise on the 9th: shield is consumed, streak survives.
    const r = advanceStreak(s, '2026-11-09');
    expect(r.state.currentStreak).toBe(8);
    expect(r.state.shields).toBe(0);
    expect(r.events).toContainEqual({ type: 'shield_used', count: 1 });
  });

  it('resets to 1 when a day is missed without a shield', () => {
    let s = advanceStreak(base, '2026-11-01').state;
    s = advanceStreak(s, '2026-11-02').state;
    const r = advanceStreak(s, '2026-11-04');
    expect(r.state.currentStreak).toBe(1);
    expect(r.state.longestStreak).toBe(2);
    expect(r.events).toContainEqual({ type: 'streak_lost', previousStreak: 2 });
  });

  it('never holds more than 2 shields', () => {
    let s: StreakState = { ...base, shields: 2 };
    s = { ...s, ...advanceStreak(s, '2026-11-01').state };
    for (let d = 2; d <= 8; d += 1) s = advanceStreak(s, `2026-11-0${d}`).state;
    expect(s.shields).toBeLessThanOrEqual(2);
  });
});
