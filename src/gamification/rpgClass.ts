import { CLASS_ORDER, TIER_NAMES } from './constants';

export type SkillClassInput = {
  slug: string;
  /** RPG class title from the skills table, e.g. "Bard", "Paladin". */
  classTitle: string;
  /** 0..3 */
  tierIndex: number;
  /** Lower-cased display name, e.g. "piano". */
  lowerName: string;
};

/**
 * RPG class from your skill mix, ordered by tier (then the prototype's
 * CLASS_ORDER): piano(Legit) + calisthenics(Adept) = "Bard Paladin".
 */
export function rpgClass(skills: SkillClassInput[]): string {
  if (skills.length === 0) return 'Larper';
  const ordered = [...skills].sort((a, b) => {
    if (b.tierIndex !== a.tierIndex) return b.tierIndex - a.tierIndex;
    const ia = CLASS_ORDER.indexOf(a.slug as (typeof CLASS_ORDER)[number]);
    const ib = CLASS_ORDER.indexOf(b.slug as (typeof CLASS_ORDER)[number]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return ordered.map((s) => s.classTitle).join(' ');
}

/**
 * Portfolio line: "Legit in piano, Apprentice in pottery, Larping in Spanish".
 */
export function portfolioLine(skills: SkillClassInput[]): string {
  if (skills.length === 0) return 'Larping at everything';
  const ordered = [...skills].sort((a, b) => b.tierIndex - a.tierIndex);
  return ordered
    .map((s) => `${TIER_NAMES[s.tierIndex] ?? 'Larping'} in ${s.lowerName}`)
    .join(', ');
}
