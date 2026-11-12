import { applyDailyCap, sessionBaseXP } from '../xp';
import { DAILY_XP_CAP } from '../constants';

describe('sessionBaseXP', () => {
  it('is 1 XP per minute', () => {
    expect(sessionBaseXP(45 * 60)).toBe(45);
    expect(sessionBaseXP(60 * 60)).toBe(60);
  });

  it('has a 5 XP minimum per session', () => {
    expect(sessionBaseXP(0)).toBe(5);
    expect(sessionBaseXP(3 * 60)).toBe(5);
    expect(sessionBaseXP(5 * 60 + 1)).toBe(5);
  });

  it('floors partial minutes', () => {
    expect(sessionBaseXP(10 * 60 + 59)).toBe(10);
  });
});

describe('applyDailyCap', () => {
  it('allows XP under the cap', () => {
    expect(applyDailyCap(0, 45)).toBe(45);
  });

  it('truncates XP at the daily cap', () => {
    expect(applyDailyCap(220, 45)).toBe(20);
    expect(applyDailyCap(DAILY_XP_CAP, 45)).toBe(0);
  });

  it('the cap is 240 XP per day', () => {
    expect(DAILY_XP_CAP).toBe(240);
  });
});
