import { supabase } from '@/src/lib/supabase';

export type Mentor = {
  userId: string;
  handle: string;
  name: string;
  color: string;
  tier: number;
  answered: number;
};

export type FeedbackThread = {
  id: string;
  direction: 'inbox' | 'sent';
  otherId: string;
  otherName: string;
  otherColor: string;
  skillId: string;
  skillName: string;
  message: string;
  status: 'pending' | 'answered' | 'declined';
  response: string | null;
  createdAt: string;
  respondedAt: string | null;
  session: {
    id: string;
    minutes: number;
    note: string | null;
    label: string | null;
    media: { key: string; kind: 'image' | 'video' } | null;
  } | null;
};

export async function listMentors(skillId: string): Promise<Mentor[]> {
  const { data, error } = await supabase.rpc('list_mentors', { p_skill_id: skillId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((m: any) => ({
    userId: m.user_id,
    handle: m.handle,
    name: m.display_name,
    color: m.avatar_color,
    tier: m.tier,
    answered: m.answered,
  }));
}

export async function requestFeedback(input: {
  mentorId: string;
  skillId: string;
  sessionId: string | null;
  message: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('request_feedback', {
    p_mentor_id: input.mentorId,
    p_skill_id: input.skillId,
    p_session_id: input.sessionId ?? undefined,
    p_message: input.message,
  });
  if (error) throw error;
  return data;
}

export async function respondFeedback(requestId: string, response: string, decline = false): Promise<void> {
  const { error } = await supabase.rpc('respond_feedback', {
    p_request_id: requestId,
    p_response: response,
    p_decline: decline,
  });
  if (error) throw error;
}

export async function getFeedbackThreads(): Promise<FeedbackThread[]> {
  const { data, error } = await supabase.rpc('get_feedback_requests');
  if (error) throw error;
  return ((data ?? []) as any[]).map((r: any) => ({
    id: r.id,
    direction: r.direction as FeedbackThread['direction'],
    otherId: r.other_id,
    otherName: r.other_name,
    otherColor: r.other_color,
    skillId: r.skill_id,
    skillName: r.skill_name,
    message: r.message,
    status: r.status as FeedbackThread['status'],
    response: r.response,
    createdAt: r.created_at,
    respondedAt: r.responded_at,
    session: r.session_id
      ? {
          id: r.session_id,
          minutes: r.session_minutes,
          note: r.session_note,
          label: r.session_label,
          media: r.media_key ? { key: r.media_key, kind: r.media_kind === 'video' ? 'video' : 'image' } : null,
        }
      : null,
  }));
}

export async function setOpenToFeedback(skillId: string, open: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_open_to_feedback', { p_skill_id: skillId, p_open: open });
  if (error) throw error;
}
