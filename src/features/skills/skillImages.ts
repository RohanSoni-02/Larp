import { Asset } from 'expo-asset';

import type { ImageData } from '@/components/ui/img-sphere';
import { CATEGORY_LABELS, tierName, type Skill, type SkillCategory, type UserSkill } from '@/src/types/app';

/**
 * Photos for skills, bundled with the app (assets/covers) so nothing is
 * hot-linked and they work offline. Each launch skill has a small pool: its
 * cover first, then extra shots. Skills without their own pool borrow from
 * their category.
 */
const SKILL_PHOTOS: Record<string, number[]> = {
  piano: [
    require('@/assets/covers/piano.jpg'),
    require('@/assets/covers/piano-1.jpg'),
    require('@/assets/covers/piano-2.jpg'),
  ],
  guitar: [
    require('@/assets/covers/guitar.jpg'),
    require('@/assets/covers/guitar-1.jpg'),
    require('@/assets/covers/guitar-2.jpg'),
  ],
  drawing: [
    require('@/assets/covers/drawing.jpg'),
    require('@/assets/covers/drawing-1.jpg'),
    require('@/assets/covers/drawing-2.jpg'),
  ],
  baking: [
    require('@/assets/covers/baking.jpg'),
    require('@/assets/covers/baking-1.jpg'),
    require('@/assets/covers/baking-2.jpg'),
  ],
  pottery: [
    require('@/assets/covers/pottery.jpg'),
    require('@/assets/covers/pottery-1.jpg'),
    require('@/assets/covers/pottery-2.jpg'),
  ],
  candle: [
    require('@/assets/covers/candle.jpg'),
    require('@/assets/covers/candle-1.jpg'),
    require('@/assets/covers/candle-2.jpg'),
  ],
  calisthenics: [
    require('@/assets/covers/calisthenics.jpg'),
    require('@/assets/covers/calisthenics-1.jpg'),
    require('@/assets/covers/calisthenics-2.jpg'),
  ],
  spanish: [
    require('@/assets/covers/spanish.jpg'),
    require('@/assets/covers/spanish-1.jpg'),
    require('@/assets/covers/spanish-2.jpg'),
  ],
  penspin: [
    require('@/assets/covers/penspin.jpg'),
    require('@/assets/covers/penspin-1.jpg'),
    require('@/assets/covers/penspin-2.jpg'),
  ],
  tech: [require('@/assets/covers/tech.jpg')],
  outdoors: [require('@/assets/covers/outdoors.jpg')],
};

const CATEGORY_POOLS: Record<SkillCategory, string[]> = {
  music: ['piano', 'guitar'],
  visual_art: ['drawing', 'pottery'],
  crafts: ['candle', 'pottery'],
  food: ['baking'],
  fitness: ['calisthenics'],
  mind: ['spanish'],
  tech: ['tech'],
  performance: ['penspin'],
  outdoors: ['outdoors'],
};

/** Skill names (lower-cased) whose pool key differs from their slug. */
const NAME_TO_POOL: Record<string, string> = {
  'candle making': 'candle',
  'pen spinning': 'penspin',
};

const ALL_PHOTOS = Object.values(SKILL_PHOTOS).flat();

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type SkillRef = {
  slug?: string | null;
  name?: string | null;
  category?: SkillCategory | null;
};

function poolFor(skill: SkillRef): number[] {
  const name = skill.name?.trim().toLowerCase() ?? '';
  const own = SKILL_PHOTOS[skill.slug ?? ''] ?? SKILL_PHOTOS[NAME_TO_POOL[name] ?? name];
  if (own) return own;
  const fromCategory = skill.category ? CATEGORY_POOLS[skill.category].flatMap((k) => SKILL_PHOTOS[k] ?? []) : [];
  return fromCategory.length > 0 ? fromCategory : ALL_PHOTOS;
}

/**
 * A photo for a skill. `seed` picks within the skill's pool: a number is used as
 * an index (0 = the skill's cover), a string (e.g. a post id) is hashed so the
 * same post always shows the same photo.
 */
export function skillPhotoUri(skill: SkillRef, seed: number | string = 0): string {
  const pool = poolFor(skill);
  const index = typeof seed === 'number' ? seed : hash(seed);
  return Asset.fromModule(pool[index % pool.length]!).uri;
}

export function getSkillImageUrl(name: string, category: SkillCategory, variantIndex = 0): string {
  return skillPhotoUri({ name, category }, variantIndex);
}

/**
 * Builds an ImageData array for a user's multi-skill portfolio.
 * Repeats skills with varied photography if the user has a small number of skills (e.g. 2-8)
 * so the 3D Fibonacci sphere is visually balanced.
 */
export function buildPortfolioSphereImages(
  portfolio: (UserSkill & { skills: Skill })[],
  options?: {
    actionLabel?: string;
    onSelectSkill?: (skill: Skill) => void;
    minNodes?: number;
  },
): ImageData[] {
  const valid = portfolio.filter((p) => Boolean(p.skills));
  if (valid.length === 0) return [];

  const targetCount = Math.max(options?.minNodes ?? 20, valid.length);
  const items: ImageData[] = [];

  for (let i = 0; i < targetCount; i++) {
    const entry = valid[i % valid.length]!;
    const skill = entry.skills;
    const variant = Math.floor(i / valid.length);
    const hours = Math.round((entry.total_minutes / 60) * 10) / 10;

    items.push({
      id: `portfolio-${skill.id}-${i}`,
      skillId: skill.id,
      src: getSkillImageUrl(skill.name, skill.category, variant),
      alt: `${skill.name} (${CATEGORY_LABELS[skill.category]})`,
      title: skill.name,
      badge: `${tierName(entry.tier)} · ${entry.total_xp} XP`,
      color: skill.color,
      description: `${hours}h practised · ${entry.nodes_landed} nodes landed${skill.blurb ? `\n${skill.blurb}` : ''}`,
      actionLabel: options?.actionLabel,
      onAction: options?.onSelectSkill ? () => options.onSelectSkill?.(skill) : undefined,
    });
  }

  return items;
}

/**
 * Builds an ImageData array for a catalog of multiple skills (e.g. in Add a Skill / Onboarding).
 */
export function buildCatalogSphereImages(
  skills: {
    id: string;
    name: string;
    category: SkillCategory;
    color: string;
    owned?: boolean;
    description?: string;
    onAction?: () => void;
    actionLabel?: string;
  }[],
  minNodes = 24,
): ImageData[] {
  if (skills.length === 0) return [];
  const targetCount = Math.max(minNodes, skills.length);
  const items: ImageData[] = [];

  for (let i = 0; i < targetCount; i++) {
    const item = skills[i % skills.length]!;
    const variant = Math.floor(i / skills.length);
    items.push({
      id: `${item.id}-${i}`,
      skillId: item.id,
      src: getSkillImageUrl(item.name, item.category, variant),
      alt: item.name,
      title: item.name,
      badge: CATEGORY_LABELS[item.category],
      color: item.color,
      description:
        item.description ??
        `Start climbing the ${item.name.toLowerCase()} skill tree in ${CATEGORY_LABELS[item.category].toLowerCase()}.`,
      actionLabel: item.actionLabel,
      onAction: item.onAction,
    });
  }

  return items;
}
