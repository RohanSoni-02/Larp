import { supabase } from '@/src/lib/supabase';

export type ConversationSummary = {
  id: string;
  otherId: string;
  otherHandle: string;
  otherName: string;
  otherColor: string;
  lastBody: string | null;
  lastFromMe: boolean;
  lastAt: string | null;
  unread: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  at: string;
  /** Optimistic: sent from this device, not yet confirmed by the server. */
  pending?: boolean;
};

export type ChatPerson = { id: string; handle: string; name: string; color: string };

/** Newest messages a thread loads; older history is out of scope for now. */
const THREAD_LIMIT = 200;

export function mapMessage(row: any): ChatMessage {
  return { id: row.id, senderId: row.sender_id, body: row.body, at: row.created_at };
}

export async function listConversations(meId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('list_conversations');
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    id: row.conversation_id,
    otherId: row.other_id,
    otherHandle: row.other_handle,
    otherName: row.other_name || row.other_handle,
    otherColor: row.other_color,
    lastBody: row.last_body,
    lastFromMe: row.last_sender_id === meId,
    lastAt: row.last_message_at,
    unread: row.unread_count ?? 0,
  }));
}

/** Opens the one conversation between me and `userId` (creating it if needed). */
export async function startConversation(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_conversation', { p_user_id: userId });
  if (error) throw error;
  return data as string;
}

export async function getChatPartner(conversationId: string, meId: string): Promise<ChatPerson | null> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('profiles ( id, handle, display_name, avatar_color )')
    .eq('conversation_id', conversationId)
    .neq('user_id', meId)
    .maybeSingle();
  if (error) throw error;
  const p = (data as any)?.profiles;
  return p ? { id: p.id, handle: p.handle, name: p.display_name || p.handle, color: p.avatar_color } : null;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(THREAD_LIMIT);
  if (error) throw error;
  return (data ?? []).map(mapMessage).reverse();
}

export async function sendMessage(input: { id: string; conversationId: string; senderId: string; body: string }): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    id: input.id,
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    body: input.body,
  });
  // 42501: the insert policy refused it — the conversation is blocked.
  if (error) throw error.code === '42501' ? new Error('You can’t message this person.') : error;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
  if (error) throw error;
}

/** People I follow — the default suggestions when starting a new chat. */
export async function listFollowing(meId: string): Promise<ChatPerson[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_followee_id_fkey ( id, handle, display_name, avatar_color )')
    .eq('follower_id', meId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.profiles)
    .filter(Boolean)
    .map((p: any) => ({ id: p.id, handle: p.handle, name: p.display_name || p.handle, color: p.avatar_color }));
}

/** Insert or replace a server-confirmed message by id, keeping the thread in time order. */
export function mergeMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const rest = list.filter((m) => m.id !== message.id);
  const at = Date.parse(message.at);
  let i = rest.length;
  while (i > 0 && (rest[i - 1]!.pending || Date.parse(rest[i - 1]!.at) > at)) i--;
  return [...rest.slice(0, i), message, ...rest.slice(i)];
}
