import { supabase } from '@/src/lib/supabase';
import { CATEGORY_LABELS, type Skill, type SkillCategory } from '@/src/types/app';

/** All approved skills, grouped by category in the prototype's order. */
export async function listApprovedSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, slug, name, lower_name, category, color, kudo_label, class_title, blurb, is_custom, status')
    .eq('status', 'approved')
    .order('category')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Skill[];
}

export type SkillGroup = { category: SkillCategory; label: string; skills: Skill[] };

export function groupByCategory(skills: Skill[]): SkillGroup[] {
  const order = Object.keys(CATEGORY_LABELS) as SkillCategory[];
  const groups = new Map<SkillCategory, Skill[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
  }
  return order
    .filter((category) => groups.has(category))
    .map((category) => ({ category, label: CATEGORY_LABELS[category], skills: groups.get(category)! }));
}

/** All skills I can use: approved ones plus my own pending customs. */
export async function listUsableSkills(meId: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, slug, name, lower_name, category, color, kudo_label, class_title, blurb, is_custom, status')
    .or(`status.eq.approved,created_by.eq.${meId}`)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Skill[];
}

/**
 * The skill a name should resolve to before creating a custom one: an approved
 * skill, or my own pending custom with that exact name (approved wins).
 */
export async function findUsableSkillId(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('skills')
    .select('id')
    .eq('lower_name', name.trim().toLowerCase())
    .in('status', ['approved', 'pending'])
    .order('status', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Add a skill to my portfolio (totals forced to zero by the DB trigger). */
export async function addSkillToPortfolio(meId: string, skillId: string): Promise<void> {
  // UPDATE is revoked on user_skills, so a merging upsert is denied outright.
  const { error } = await supabase
    .from('user_skills')
    .upsert({ user_id: meId, skill_id: skillId }, { ignoreDuplicates: true });
  if (error) throw error;
}
