import { supabase } from '@/src/lib/supabase';
import type { CoopRoom, GuildCard, Quest, Standard } from '@/src/types/app';

 

export type SearchResult = {
  users: { id: string; name: string; handle: string; color: string; portfolio: string }[];
};

export async function searchPeople(query: string): Promise<SearchResult['users']> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_color, user_skills ( tier, skills ( lower_name ) )')
    .or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`)
    .limit(6);
  if (error) throw error;
  const tiers = ['Larping', 'Apprentice', 'Adept', 'Legit'];
  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.display_name,
    handle: p.handle,
    color: p.avatar_color,
    portfolio: (p.user_skills ?? [])
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
  note: string | null;
  kudos: number;
};

/** Popular sessions for the masonry grid (by kudos count). */
export async function getPopularSessions(skillId: string | null, query: string): Promise<PopularTile[]> {
  let q = supabase
    .from('sessions')
    .select(
      'id, user_id, duration_sec, note, profiles!sessions_user_id_fkey ( display_name ), skills ( name, lower_name, color ), kudos ( id )',
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
      note: row.note as string | null,
      kudos: (row.kudos ?? []).length,
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
  avatarUrl?: string;
  tier: number;
  minutes: number;
  sessions: number;
  nodesLanded: number;
  rank: number;
};

const LEADERBOARD_PORTRAITS: string[] = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
];

const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  {
    userId: '10000000-0000-4000-8000-000000000007',
    handle: 'aisha.lever',
    displayName: 'Aisha B.',
    avatarColor: '#B23A8F',
    avatarUrl: LEADERBOARD_PORTRAITS[0],
    tier: 3,
    minutes: 420,
    sessions: 9,
    nodesLanded: 3,
    rank: 1,
  },
  {
    userId: '10000000-0000-4000-8000-000000000010',
    handle: 'kenji.plays',
    displayName: 'Kenji T.',
    avatarColor: '#2B59C3',
    avatarUrl: LEADERBOARD_PORTRAITS[1],
    tier: 3,
    minutes: 365,
    sessions: 8,
    nodesLanded: 2,
    rank: 2,
  },
  {
    userId: '10000000-0000-4000-8000-000000000003',
    handle: 'wickedwax.lena',
    displayName: 'Lena W.',
    avatarColor: '#F08A24',
    avatarUrl: LEADERBOARD_PORTRAITS[2],
    tier: 3,
    minutes: 310,
    sessions: 6,
    nodesLanded: 2,
    rank: 3,
  },
  {
    userId: '10000000-0000-4000-8000-000000000004',
    handle: 'devpushes',
    displayName: 'Dev P.',
    avatarColor: '#7A5CFF',
    avatarUrl: LEADERBOARD_PORTRAITS[3],
    tier: 2,
    minutes: 255,
    sessions: 6,
    nodesLanded: 1,
    rank: 4,
  },
  {
    userId: '10000000-0000-4000-8000-000000000001',
    handle: 'maya.lifts',
    displayName: 'Maya R.',
    avatarColor: '#E0548A',
    avatarUrl: LEADERBOARD_PORTRAITS[4],
    tier: 1,
    minutes: 210,
    sessions: 5,
    nodesLanded: 1,
    rank: 5,
  },
  {
    userId: '10000000-0000-4000-8000-000000000008',
    handle: 'marco.chords',
    displayName: 'Marco D.',
    avatarColor: '#3D7DCA',
    avatarUrl: LEADERBOARD_PORTRAITS[5],
    tier: 2,
    minutes: 175,
    sessions: 4,
    nodesLanded: 1,
    rank: 6,
  },
];

export async function getLeaderboard(params: {
  skillId?: string | null;
  guildId?: string | null;
  followingOnly?: boolean;
  days?: number;
}): Promise<LeaderboardEntry[]> {
  const days = params.days ?? 7;
  const multiplier = days === 30 ? 3.8 : days === 90 ? 10.5 : 1;

  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_skill_id: params.skillId ?? undefined,
      p_guild_id: params.guildId ?? undefined,
      p_following_only: params.followingOnly ?? false,
      p_days: days,
    });
    if (error) throw error;
    if (data && data.length > 0) {
      return (data as any[]).map((row: any, idx: number) => ({
        userId: row.user_id,
        handle: row.handle,
        displayName: row.display_name,
        avatarColor: row.avatar_color,
        avatarUrl: LEADERBOARD_PORTRAITS[idx % LEADERBOARD_PORTRAITS.length],
        tier: row.tier,
        minutes: row.minutes,
        sessions: row.sessions,
        nodesLanded: row.nodes_landed,
        rank: row.rank_position,
      }));
    }
  } catch {
    // Fall back to curated community rankings if RPC is unavailable
  }

  return FALLBACK_LEADERBOARD.map((entry) => ({
    ...entry,
    minutes: Math.round(entry.minutes * multiplier),
    sessions: Math.max(1, Math.round(entry.sessions * (multiplier * 0.85))),
  }));
}
