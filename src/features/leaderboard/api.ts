import { supabase } from '@/src/lib/supabase';

export type LeaderboardScope = {
  skillId?: string | null;
  guildId?: string | null;
  followingOnly?: boolean;
  days: 7 | 30;
};

export type LeaderboardRow = {
  userId: string;
  handle: string;
  name: string;
  color: string;
  tier: number;
  minutes: number;
  sessions: number;
  nodesLanded: number;
  rank: number;
};

export async function getLeaderboard(scope: LeaderboardScope): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_skill_id: scope.skillId ?? undefined,
    p_guild_id: scope.guildId ?? undefined,
    p_following_only: scope.followingOnly ?? false,
    p_days: scope.days,
  });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r: any) => ({
    userId: r.user_id,
    handle: r.handle,
    name: r.display_name,
    color: r.avatar_color,
    tier: r.tier,
    minutes: r.minutes,
    sessions: r.sessions,
    nodesLanded: r.nodes_landed,
    rank: r.rank_position,
  }));
}

export async function getMyGuildIds(meId: string): Promise<string[]> {
  const { data, error } = await supabase.from('guild_members').select('guild_id').eq('user_id', meId);
  if (error) throw error;
  return (data ?? []).map((r) => r.guild_id);
}

export async function setGuildMember(meId: string, guildId: string, join: boolean): Promise<void> {
  const { error } = join
    ? await supabase.from('guild_members').insert({ guild_id: guildId, user_id: meId })
    : await supabase.from('guild_members').delete().match({ guild_id: guildId, user_id: meId });
  if (error) throw error;
}

export async function setShowOnLeaderboards(meId: string, show: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ show_on_leaderboards: show }).eq('id', meId);
  if (error) throw error;
}
