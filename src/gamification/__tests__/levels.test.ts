import { levelFromXp, xpForLevel } from '../levels';

describe('xpForLevel', () => {
  it('follows 50 × (L − 1) × L', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(xpForLevel(4)).toBe(600);
    expect(xpForLevel(5)).toBe(1000);
  });

  it('rejects level 0', () => {
    expect(() => xpForLevel(0)).toThrow(RangeError);
  });
});

describe('levelFromXp', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, needed: 100, progress: 0 });
  });

  it('levels up exactly at the threshold', () => {
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3);
  });

  it('tracks progress within a level', () => {
    const p = levelFromXp(150);
    expect(p.level).toBe(2);
    expect(p.current).toBe(50);
    expect(p.needed).toBe(200);
    expect(p.progress).toBeCloseTo(0.25);
  });

  it('never goes below level 1 for negative input', () => {
    expect(levelFromXp(-50).level).toBe(1);
  });
});
