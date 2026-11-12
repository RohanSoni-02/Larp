import type { ImageData } from '@/components/ui/img-sphere';
import { CATEGORY_LABELS, tierName, type Skill, type SkillCategory, type UserSkill } from '@/src/types/app';

/**
 * Curated Unsplash stock photography for skill categories and individual skills.
 */
const CATEGORY_IMAGES: Record<SkillCategory, string[]> = {
  music: [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80',
  ],
  visual_art: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80',
  ],
  crafts: [
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1584992236310-6edddc08a2f9?auto=format&fit=crop&w=600&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  ],
  mind: [
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  ],
  performance: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=600&q=80',
  ],
  outdoors: [
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80',
  ],
};

const SKILL_NAME_IMAGES: Record<string, string> = {
  piano: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80',
  guitar: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
  drums: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80',
  violin: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=600&q=80',
  drawing: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
  photography: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  watercolor: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80',
  pottery: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
  crochet: 'https://images.unsplash.com/photo-1584992236310-6edddc08a2f9?auto=format&fit=crop&w=600&q=80',
  woodworking: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=600&q=80',
  baking: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'bread and sourdough': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'latte art': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
  skateboarding: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=600&q=80',
  calisthenics: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
  'coding projects': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
  gardening: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80',
  bonsai: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80',
};

export function getSkillImageUrl(name: string, category: SkillCategory, variantIndex = 0): string {
  const key = name.trim().toLowerCase();
  if (SKILL_NAME_IMAGES[key] && variantIndex === 0) {
    return SKILL_NAME_IMAGES[key]!;
  }
  const pool = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.crafts;
  return pool[variantIndex % pool.length]!;
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
