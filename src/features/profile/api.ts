import { supabase } from '@/src/lib/supabase';
import type { Profile } from '@/src/types/app';

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export type SuggestedPerson = Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_color' | 'bio'>;

/** People who practise any of the given skills — onboarding suggestions. */
export async function getSuggestedPeople(
  skillIds: string[],
  excludeUserId: string,
  limit = 6,
): Promise<SuggestedPerson[]> {
  if (skillIds.length === 0) return [];
  const { data, error } = await supabase
    .from('user_skills')
    .select('user_id, profiles!inner(id, handle, display_name, avatar_color, bio)')
    .in('skill_id', skillIds)
    .neq('user_id', excludeUserId)
    .limit(50);
  if (error) throw error;

  const seen = new Set<string>();
  const people: SuggestedPerson[] = [];
  for (const row of data ?? []) {
    const p = row.profiles as unknown as SuggestedPerson;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      people.push(p);
      if (people.length >= limit) break;
    }
  }
  return people;
}

export type OnboardingInput = {
  userId: string;
  displayName: string;
  timezone: string;
  reminderTime: string | null;
  skillIds: string[];
  followUserIds: string[];
};

/**
 * Persist onboarding: profile details + picked skills + initial follows.
 * user_skills rows start at tier 0 with zeroed totals — the database trigger
 * forces these defaults so a modified client can't seed fake progress.
 */
export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  const { userId, displayName, timezone, reminderTime, skillIds, followUserIds } = input;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      timezone,
      reminder_time: reminderTime,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  if (skillIds.length > 0) {
    const { error: skillsError } = await supabase
      .from('user_skills')
      .upsert(skillIds.map((skillId) => ({ user_id: userId, skill_id: skillId })));
    if (skillsError) throw skillsError;
  }

  if (followUserIds.length > 0) {
    const { error: followsError } = await supabase
      .from('follows')
      .upsert(followUserIds.map((followeeId) => ({ follower_id: userId, followee_id: followeeId })));
    if (followsError) throw followsError;
  }
}

/* ─── profile page data ─── */

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('handle', handle).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export type FollowCounts = { followers: number; following: number; followedByMe: boolean };

export async function getFollowCounts(meId: string, userId: string): Promise<FollowCounts> {
  const [followers, following, mine] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', userId),
    supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('follows').select('followee_id').eq('follower_id', meId).eq('followee_id', userId).maybeSingle(),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    followedByMe: Boolean(mine.data),
  };
}

export type ProfileStats = {
  totalMinutes: number;
  sessionCount: number;
  minutesByDay: Record<string, number>;
  activeDaysThisWeek: string[];
};

/** Sessions for the stats row + 14-week heatmap (own profile or public data). */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const since = new Date();
  since.setDate(since.getDate() - 7 * 14);
  const { data, error } = await supabase
    .from('sessions')
    .select('started_at, duration_sec')
    .eq('user_id', userId)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true });
  if (error) throw error;

  const { dayKey } = await import('@/src/lib/format');
  const minutesByDay: Record<string, number> = {};
  let totalMinutes = 0;
  for (const s of data ?? []) {
    const minutes = s.duration_sec / 60;
    totalMinutes += minutes;
    const key = dayKey(s.started_at);
    minutesByDay[key] = (minutesByDay[key] ?? 0) + minutes;
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activeDaysThisWeek = Object.keys(minutesByDay).filter((k) => new Date(k) >= weekAgo);

  return { totalMinutes, sessionCount: (data ?? []).length, minutesByDay, activeDaysThisWeek };
}

export type StreakInfo = { current: number; longest: number; shields: number; shieldDaysUsed: string[] };

export async function getMyStreak(meId: string): Promise<StreakInfo> {
  const { data } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak, shields')
    .eq('user_id', meId)
    .maybeSingle();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: shieldEvents } = await supabase
    .from('streak_shield_events')
    .select('local_date')
    .eq('user_id', meId)
    .eq('kind', 'used')
    .gte('local_date', weekAgo.toISOString().slice(0, 10));
  return {
    current: data?.current_streak ?? 0,
    longest: data?.longest_streak ?? 0,
    shields: data?.shields ?? 0,
    shieldDaysUsed: (shieldEvents ?? []).map((e) => e.local_date),
  };
}

export type VouchInfo = { skillId: string; count: number; includesMe: boolean };

export async function getVouches(meId: string, voucheeId: string): Promise<VouchInfo[]> {
  const { data, error } = await supabase.from('vouches').select('skill_id, voucher_id').eq('vouchee_id', voucheeId);
  if (error) throw error;
  const bySkill = new Map<string, { count: number; includesMe: boolean }>();
  for (const v of data ?? []) {
    const entry = bySkill.get(v.skill_id) ?? { count: 0, includesMe: false };
    entry.count += 1;
    if (v.voucher_id === meId) entry.includesMe = true;
    bySkill.set(v.skill_id, entry);
  }
  return [...bySkill.entries()].map(([skillId, info]) => ({ skillId, ...info }));
}

export async function castVouch(voucheeId: string, skillId: string): Promise<void> {
  const { error } = await supabase.rpc('cast_vouch', { p_vouchee_id: voucheeId, p_skill_id: skillId });
  if (error) throw error;
}

export async function removeVouch(voucheeId: string, skillId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_vouch', { p_vouchee_id: voucheeId, p_skill_id: skillId });
  if (error) throw error;
}

export async function updateProfile(userId: string, input: { display_name: string; bio: string }): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: input.display_name, bio: input.bio || null })
    .eq('id', userId);
  if (error) throw error;
}

/** Glow-up data: first + latest session media per skill (empty → preview state). */
export type GlowupInfo = {
  skillId: string;
  firstKey: string | null;
  latestKey: string | null;
  daySpan: number;
  photoDays: number;
};

export async function getGlowups(userId: string): Promise<GlowupInfo[]> {
  const { data, error } = await supabase
    .from('media')
    .select('skill:sessions!media_session_id_fkey ( skill_id, started_at ), storage_key, created_at')
    .eq('owner_id', userId)
    .not('session_id', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const bySkill = new Map<string, { keys: string[]; days: Set<string> }>();
  for (const row of data ?? []) {
    const skillId = (row.skill as unknown as { skill_id: string } | null)?.skill_id;
    if (!skillId) continue;
    const entry = bySkill.get(skillId) ?? { keys: [], days: new Set<string>() };
    entry.keys.push(row.storage_key);
    entry.days.add(row.created_at.slice(0, 10));
    bySkill.set(skillId, entry);
  }
  return [...bySkill.entries()].map(([skillId, info]) => ({
    skillId,
    firstKey: info.keys[0] ?? null,
    latestKey: info.keys[info.keys.length - 1] ?? null,
    daySpan: info.keys.length >= 2 && info.keys[0] ? Math.max(0, info.days.size - 1) : 0,
    photoDays: info.days.size,
  }));
}
