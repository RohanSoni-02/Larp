import { supabase } from '@/src/lib/supabase';
import type { CoopRoom, GuildCard, PostMedia, Quest, SkillCategory, Standard } from '@/src/types/app';

 

export type SearchResult = {
  users: {
    id: string;
    name: string;
    handle: string;
    color: string;
    avatarPath: string | null;
    official: boolean;
    portfolio: string;
  }[];
};

export async function searchPeople(query: string): Promise<SearchResult['users']> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_color, avatar_path, is_official, user_skills ( tier, skills ( lower_name ) )')
    .or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`)
    .limit(6);
  if (error) throw error;
  const tiers = ['Larping', 'Apprentice', 'Adept', 'Legit'];
  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.display_name,
    handle: p.handle,
    color: p.avatar_color,
    avatarPath: p.avatar_path ?? null,
    official: Boolean(p.is_official),
    portfolio: p.is_official
      ? `Official larpr guide${p.user_skills?.[0]?.skills?.lower_name ? ` · ${p.user_skills[0].skills.lower_name}` : ''}`
      : (p.user_skills ?? [])
          .sort((a: any, b: any) => b.tier - a.tier)
          .map((us: any) => `${tiers[us.tier]} in ${us.skills?.lower_name ?? '?'}`)
          .join(', '),
  }));
}

export type PopularTile = {
  id: string;
  userId: string;
  authorName: string;
  minutes: number;
  skillName: string;
  skillLower: string;
  skillColor: string;
  skillSlug: string | null;
  skillCategory: SkillCategory | null;
  note: string | null;
  kudos: number;
  /** First photo on the post, if any; tiles fall back to generated art without one. */
  image: PostMedia | null;
};

function firstImage(rows: any[] | null | undefined): PostMedia | null {
  const m = (rows ?? []).find((r) => r.storage_key && r.kind === 'image');
  return m ? { key: m.storage_key, kind: 'image', publicPath: m.public_path ?? null } : null;
}

/** Popular sessions for the masonry grid (by kudos count). */
export async function getPopularSessions(skillId: string | null, query: string): Promise<PopularTile[]> {
  let q = supabase
    .from('sessions')
    .select(
      'id, user_id, duration_sec, note, profiles!sessions_user_id_fkey ( display_name ), skills ( name, lower_name, color, slug, category ), kudos ( id ), media ( storage_key, public_path, kind, status )',
    )
    .eq('visibility', 'public')
    .order('started_at', { ascending: false })
    .limit(120);
  if (skillId) q = q.eq('skill_id', skillId);
  const { data, error } = await q;
  if (error) throw error;
  const needle = query.trim().toLowerCase();
  return (data ?? [])
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      authorName: row.profiles?.display_name ?? 'Larper',
      minutes: Math.round(row.duration_sec / 60),
      skillName: row.skills?.name ?? 'Skill',
      skillLower: row.skills?.lower_name ?? 'skill',
      skillColor: row.skills?.color ?? '#5B3DF5',
      skillSlug: row.skills?.slug ?? null,
      skillCategory: row.skills?.category ?? null,
      note: row.note as string | null,
      kudos: (row.kudos ?? []).length,
      image: firstImage(row.media),
    }))
    .filter(
      (t) =>
        !needle ||
        t.authorName.toLowerCase().includes(needle) ||
        (t.note ?? '').toLowerCase().includes(needle),
    )
    .sort((a, b) => b.kudos - a.kudos)
    .slice(0, 18);
}

export async function getQuests(meId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('id, skill_id, title, description, goal_days, ends_on, quest_participants ( user_id, progress_days )')
    .order('ends_on', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => {
    const mine = (row.quest_participants ?? []).find((p: any) => p.user_id === meId);
    return {
      id: row.id,
      skillId: row.skill_id,
      title: row.title,
      description: row.description,
      goalDays: row.goal_days,
      endsOn: row.ends_on,
      people: (row.quest_participants ?? []).length,
      joined: Boolean(mine),
      progressDays: mine?.progress_days ?? 0,
    };
  });
}

export async function setQuestJoined(meId: string, questId: string, join: boolean): Promise<void> {
  if (join) {
    const { error } = await supabase.from('quest_participants').insert({ quest_id: questId, user_id: meId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('quest_participants').delete().match({ quest_id: questId, user_id: meId });
    if (error) throw error;
  }
}

export async function getStandards(): Promise<Standard[]> {
  const { data, error } = await supabase
    .from('standards')
    .select(
      'id, skill_id, title, description, result_ladder, standard_attempts ( user_id, result_index, tier_at_attempt, profiles!standard_attempts_user_id_fkey ( display_name, avatar_color ) )',
    )
    .order('title');
  if (error) throw error;
  return (data ?? []).map((row: any) => {
    const ladder: string[] = row.result_ladder ?? [];
    const bestByTier = new Map<number, any>();
    for (const a of row.standard_attempts ?? []) {
      if (!bestByTier.has(a.tier_at_attempt)) bestByTier.set(a.tier_at_attempt, a);
    }
    return {
      id: row.id,
      skillId: row.skill_id,
      title: row.title,
      description: row.description,
      ladder,
      attempts: [...bestByTier.entries()]
        .sort(([a], [b]) => a - b)
        .map(([tier, a]) => ({
          userId: a.user_id,
          name: a.profiles?.display_name ?? 'Larper',
          color: a.profiles?.avatar_color ?? '#5B3DF5',
          tier,
          result: ladder[a.result_index ?? tier] ?? '',
        })),
    };
  });
}

export async function getRooms(): Promise<CoopRoom[]> {
  const { data, error } = await supabase
    .from('coop_rooms')
    .select('id, skill_id, title, started_at')
    .is('ended_at', null)
    .order('started_at', { ascending: false });
  if (error) throw error;
  const rooms = data ?? [];
  if (rooms.length === 0) return [];

  // "Practising now" ≈ people with a session in that skill in the last 2 hours.
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const skillIds = [...new Set(rooms.map((r) => r.skill_id as string))];
  const { data: recent } = await supabase
    .from('sessions')
    .select('user_id, skill_id, profiles!sessions_user_id_fkey ( display_name, avatar_color )')
    .in('skill_id', skillIds)
    .gte('started_at', since);

  return rooms.map((room: any) => {
    const seen = new Map<string, { id: string; name: string; color: string }>();
    for (const s of recent ?? []) {
      if (s.skill_id === room.skill_id && !seen.has(s.user_id)) {
        seen.set(s.user_id, {
          id: s.user_id,
          name: (s as any).profiles?.display_name ?? 'Larper',
          color: (s as any).profiles?.avatar_color ?? '#5B3DF5',
        });
      }
    }
    return {
      id: room.id,
      skillId: room.skill_id,
      title: room.title,
      startedAt: room.started_at,
      members: [...seen.values()].slice(0, 6),
    };
  });
}

export async function getGuilds(meId: string): Promise<GuildCard[]> {
  const { data, error } = await supabase
    .from('guilds')
    .select('id, name, skill_id, place, events ( id, title, starts_at, rsvps ( user_id, status ) )')
    .order('name');
  if (error) throw error;
  const now = new Date().toISOString();
  return (data ?? []).map((g: any) => {
    const upcoming = (g.events ?? [])
      .filter((e: any) => e.starts_at >= now)
      .sort((a: any, b: any) => (a.starts_at < b.starts_at ? -1 : 1))[0];
    const going = (upcoming?.rsvps ?? []).filter((r: any) => r.status === 'going');
    return {
      id: g.id,
      name: g.name,
      skillId: g.skill_id,
      place: upcoming?.place ?? g.place,
      eventId: upcoming?.id ?? null,
      eventTitle: upcoming?.title ?? null,
      startsAt: upcoming?.starts_at ?? null,
      goingCount: going.length,
      imGoing: going.some((r: any) => r.user_id === meId),
    };
  });
}

export async function setRsvp(meId: string, eventId: string, going: boolean): Promise<void> {
  if (going) {
    const { error } = await supabase.from('rsvps').insert({ event_id: eventId, user_id: meId, status: 'going' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('rsvps').delete().match({ event_id: eventId, user_id: meId });
    if (error) throw error;
  }
}

export type LeaderboardEntry = {
  userId: string;
  handle: string;
  displayName: string;
  avatarColor: string;
  tier: number;
  minutes: number;
  sessions: number;
  nodesLanded: number;
  rank: number;
};

export async function getLeaderboard(params: {
  skillId?: string | null;
  guildId?: string | null;
  followingOnly?: boolean;
  days?: number;
}): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_skill_id: params.skillId ?? undefined,
    p_guild_id: params.guildId ?? undefined,
    p_following_only: params.followingOnly ?? false,
    p_days: params.days ?? 7,
  });
  if (error) throw error;
  // A new community has an empty board; the screen renders an honest empty state.
  return ((data ?? []) as any[]).map((row) => ({
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    tier: row.tier,
    minutes: row.minutes,
    sessions: row.sessions,
    nodesLanded: row.nodes_landed,
    rank: row.rank_position,
  }));
}
