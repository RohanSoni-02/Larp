import { supabase } from '@/src/lib/supabase';

import type { SessionPlan, TemplateBlock } from './blocks';

export type SavedTemplate = SessionPlan & { id: string; skillId: string | null };

export async function getMyTemplates(): Promise<SavedTemplate[]> {
  const { data, error } = await supabase
    .from('session_templates')
    .select('id, name, skill_id, blocks')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    skillId: t.skill_id,
    blocks: t.blocks as TemplateBlock[],
  }));
}

export async function saveTemplate(input: SessionPlan & { id?: string; skillId: string | null }): Promise<void> {
  const row = {
    name: input.name.trim(),
    skill_id: input.skillId,
    blocks: input.blocks.map((b) => ({ label: b.label.trim(), minutes: Math.round(b.minutes) })),
  };
  const { error } = input.id
    ? await supabase.from('session_templates').update(row).eq('id', input.id)
    : await supabase.from('session_templates').insert(row);
  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('session_templates').delete().eq('id', id);
  if (error) throw error;
}
