import * as Linking from 'expo-linking';

import { supabase } from '@/src/lib/supabase';
import type { PendingInvite } from '@/src/stores/invite';

/** Deep link that opens the invite screen with the inviter + a starter skill. */
export function buildInviteLink(handle: string, skillSlug?: string | null): string {
  return Linking.createURL('/invite', {
    queryParams: skillSlug ? { from: handle, skill: skillSlug } : { from: handle },
  });
}

export function inviteMessage(name: string, handle: string, skill?: { name: string; slug: string } | null): string {
  const link = buildInviteLink(handle, skill?.slug);
  return skill
    ? `${name} is learning ${skill.name} on Larping — start it with them: ${link}`
    : `${name} invited you to Larping, the Strava for skills: ${link}`;
}

export type InvitePreview = {
  inviter: { id: string; name: string; handle: string; color: string; classTitle: string | null } | null;
  skill: { id: string; name: string; color: string; blurb: string | null; inviterTier: number | null } | null;
};

export async function getInvitePreview(invite: PendingInvite): Promise<InvitePreview> {
  const [profileRes, skillRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, handle, avatar_color, class_title')
      .eq('handle', invite.from)
      .maybeSingle(),
    invite.skill
      ? supabase.from('skills').select('id, name, color, blurb').eq('slug', invite.skill).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const p = profileRes.data;
  const s = skillRes.data;
  let inviterTier: number | null = null;
  if (p && s) {
    const { data } = await supabase
      .from('user_skills')
      .select('tier')
      .eq('user_id', p.id)
      .eq('skill_id', s.id)
      .maybeSingle();
    inviterTier = data?.tier ?? null;
  }
  return {
    inviter: p
      ? { id: p.id, name: p.display_name, handle: p.handle, color: p.avatar_color, classTitle: p.class_title }
      : null,
    skill: s ? { id: s.id, name: s.name, color: s.color, blurb: s.blurb, inviterTier } : null,
  };
}

/** Follow the inviter and add the starter skill. Idempotent. */
export async function acceptInvite(meId: string, invite: PendingInvite): Promise<{ skillId: string | null }> {
  const preview = await getInvitePreview(invite);
  if (preview.inviter && preview.inviter.id !== meId) {
    const { error } = await supabase
      .from('follows')
      .upsert({ follower_id: meId, followee_id: preview.inviter.id }, { ignoreDuplicates: true });
    if (error) throw error;
  }
  if (preview.skill) {
    const { error } = await supabase
      .from('user_skills')
      .upsert({ user_id: meId, skill_id: preview.skill.id }, { ignoreDuplicates: true });
    if (error) throw error;
  }
  return { skillId: preview.skill?.id ?? null };
}
