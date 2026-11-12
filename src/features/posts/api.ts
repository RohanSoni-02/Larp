import { supabase } from '@/src/lib/supabase';
import type { FeedPost, PostMedia } from '@/src/types/app';

/* Nested selects: PostgREST embeds follow RLS, so private/blocked content and
   blurred Larp Checks never reach the client. */

const SESSION_SELECT = [
  'id, user_id, skill_id, started_at, duration_sec, note, label, landed_node, created_at',
  'profiles!sessions_user_id_fkey ( id, handle, display_name, avatar_color, user_skills ( skill_id, tier ) )',
  'skills ( id, name, lower_name, color, kudo_label, slug )',
  'skill_nodes ( name )',
  'kudos ( label, giver_id )',
  'comments ( id )',
  'saves ( user_id )',
  'media ( storage_key, kind, status )',
].join(',');

const LARP_CHECK_SELECT = [
  'id, user_id, skill_id, posted_at, is_late',
  'profiles!larp_checks_user_id_fkey ( id, handle, display_name, avatar_color, user_skills ( skill_id, tier ) )',
  'skills ( id, name, lower_name, color, kudo_label, slug )',
  'kudos ( label, giver_id )',
  'comments ( id )',
  'saves ( user_id )',
  'work:media!larp_checks_work_media_id_fkey ( storage_key, kind, status )',
  'selfie:media!larp_checks_selfie_media_id_fkey ( storage_key, kind, status )',
].join(',');

 

function tierOf(profile: any, skillId: string): number {
  const row = (profile?.user_skills ?? []).find((us: any) => us.skill_id === skillId);
  return row?.tier ?? 0;
}

function mediaList(rows: any[] | null | undefined): PostMedia[] {
  return (rows ?? [])
    .filter((m) => m.storage_key)
    .map((m) => ({ key: m.storage_key as string, kind: m.kind as 'image' | 'video' }));
}

function mapSession(row: any, meId: string | undefined): FeedPost {
  const p = row.profiles;
  const s = row.skills;
  const kudoCounts: Record<string, number> = {};
  const myKudos: string[] = [];
  for (const k of row.kudos ?? []) {
    kudoCounts[k.label] = (kudoCounts[k.label] ?? 0) + 1;
    if (k.giver_id === meId) myKudos.push(k.label);
  }
  return {
    kind: 'session',
    id: row.id,
    userId: row.user_id,
    authorName: p?.display_name ?? 'Larper',
    authorHandle: p?.handle ?? '',
    authorColor: p?.avatar_color ?? '#5B3DF5',
    authorTier: tierOf(p, row.skill_id),
    skillId: row.skill_id,
    skillName: s?.name ?? 'Skill',
    skillLower: s?.lower_name ?? 'skill',
    skillColor: s?.color ?? '#5B3DF5',
    kudoLabel: s?.kudo_label ?? 'Clean technique',
    nodeName: row.skill_nodes?.name ?? null,
    landed: row.landed_node,
    at: new Date(new Date(row.started_at).getTime() + row.duration_sec * 1000).toISOString(),
    minutes: Math.round(row.duration_sec / 60),
    note: row.note,
    label: row.label ?? '',
    isLate: false,
    kudoCounts,
    myKudos,
    commentCount: (row.comments ?? []).length,
    savedByMe: (row.saves ?? []).some((sv: any) => sv.user_id === meId),
    media: mediaList(row.media),
    selfie: null,
  };
}

function mapLarpCheck(row: any, meId: string | undefined): FeedPost {
  const base = mapSession(
    {
      ...row,
      started_at: row.posted_at,
      duration_sec: 0,
      note: null,
      label: '',
      landed_node: false,
      media: row.work ? [row.work] : [],
      skill_nodes: null,
    },
    meId,
  );
  return {
    ...base,
    kind: 'larp_check',
    at: row.posted_at,
    isLate: row.is_late,
    selfie: row.selfie?.storage_key
      ? { key: row.selfie.storage_key, kind: row.selfie.kind as 'image' | 'video' }
      : null,
  };
}

export type FeedResult = {
  posts: FeedPost[];
  followingIds: string[];
};

/** Recent sessions + today's Larp Checks the viewer is allowed to see. */
export async function getFeed(meId: string): Promise<FeedResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [sessions, checks, follows] = await Promise.all([
    supabase
      .from('sessions')
      .select(SESSION_SELECT)
      .order('started_at', { ascending: false })
      .limit(60)
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
    supabase
      .from('larp_checks')
      .select(LARP_CHECK_SELECT)
      .gte('posted_at', todayStart.toISOString())
      .order('posted_at', { ascending: false })
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
    supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', meId)
      .then((r) => {
        if (r.error) throw r.error;
        return (r.data ?? []).map((f) => f.followee_id as string);
      }),
  ]);

  const posts = [
    ...sessions.map((row) => mapSession(row, meId)),
    ...checks.map((row) => mapLarpCheck(row, meId)),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return { posts, followingIds: follows };
}

/** A single post (session or larp check) by id, for the detail route. */
export async function getPost(meId: string, id: string, kind: 'session' | 'larp_check'): Promise<FeedPost | null> {
  if (kind === 'larp_check') {
    const { data, error } = await supabase.from('larp_checks').select(LARP_CHECK_SELECT).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapLarpCheck(data, meId) : null;
  }
  const { data, error } = await supabase.from('sessions').select(SESSION_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSession(data, meId) : null;
}

/** Today's sessions + Larp Checks with media, grouped per author (stories). */
export async function getStoryGroups(meId: string): Promise<FeedPost[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [sessions, checks] = await Promise.all([
    supabase
      .from('sessions')
      .select(SESSION_SELECT)
      .gte('started_at', todayStart.toISOString())
      .order('started_at', { ascending: true })
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
    supabase
      .from('larp_checks')
      .select(LARP_CHECK_SELECT)
      .gte('posted_at', todayStart.toISOString())
      .order('posted_at', { ascending: true })
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
  ]);
  return [
    ...sessions.map((row) => mapSession(row, meId)),
    ...checks.map((row) => mapLarpCheck(row, meId)),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));
}

/** Posts (sessions + Larp Checks) by one user, newest first (profile grid). */
export async function getUserPosts(meId: string, userId: string): Promise<FeedPost[]> {
  const [sessions, checks] = await Promise.all([
    supabase
      .from('sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(90)
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
    supabase
      .from('larp_checks')
      .select(LARP_CHECK_SELECT)
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .limit(30)
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
  ]);
  return [
    ...sessions.map((row) => mapSession(row, meId)),
    ...checks.map((row) => mapLarpCheck(row, meId)),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/* ─── social mutations ─── */

export async function toggleKudo(
  meId: string,
  post: Pick<FeedPost, 'id' | 'kind'>,
  label: string,
  currentlyOn: boolean,
): Promise<void> {
  const target = post.kind === 'session' ? { session_id: post.id } : { larp_check_id: post.id };
  if (currentlyOn) {
    const { error } = await supabase.from('kudos').delete().match({ giver_id: meId, label, ...target });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('kudos').insert({ giver_id: meId, label, ...target });
    if (error) throw error;
  }
}

export async function toggleSave(meId: string, post: Pick<FeedPost, 'id' | 'kind'>, currentlyOn: boolean): Promise<void> {
  const target = post.kind === 'session' ? { session_id: post.id } : { larp_check_id: post.id };
  if (currentlyOn) {
    const { error } = await supabase.from('saves').delete().match({ user_id: meId, ...target });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('saves').insert({ user_id: meId, ...target });
    if (error) throw error;
  }
}

export async function setFollowing(meId: string, userId: string, follow: boolean): Promise<void> {
  if (follow) {
    const { error } = await supabase.from('follows').insert({ follower_id: meId, followee_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('follows').delete().match({ follower_id: meId, followee_id: userId });
    if (error) throw error;
  }
}

export async function reportContent(
  targetType: 'session' | 'comment' | 'profile' | 'larp_check',
  targetId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.from('reports').insert({ target_type: targetType, target_id: targetId, reason });
  if (error) throw error;
}

export async function blockUser(meId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('blocks').insert({ blocker_id: meId, blocked_id: userId });
  if (error) throw error;
}
