/** Larper Level: level L starts at 50 × (L − 1) × L total XP. */

export function xpForLevel(level: number): number {
  if (level < 1) throw new RangeError('level must be >= 1');
  return 50 * (level - 1) * level;
}

export type LevelProgress = {
  level: number;
  /** XP earned inside the current level. */
  current: number;
  /** XP needed to complete the current level. */
  needed: number;
  /** 0..1 progress through the current level. */
  progress: number;
};

export function levelFromXp(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  const floor = xpForLevel(level);
  const needed = xpForLevel(level + 1) - floor;
  const current = xp - floor;
  return { level, current, needed, progress: needed === 0 ? 1 : current / needed };
}
