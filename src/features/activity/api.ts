import { supabase } from '@/src/lib/supabase';
import type { ActivityItem } from '@/src/types/app';

 

export async function getActivity(meId: string): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, actor_id, data, read_at, created_at, actor:profiles!notifications_actor_id_fkey ( display_name, avatar_color )')
    .eq('recipient_id', meId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    type: row.type,
    actorId: row.actor_id,
    actorName: row.actor?.display_name ?? null,
    actorColor: row.actor?.avatar_color ?? null,
    data: row.data ?? {},
    at: row.created_at,
    unread: row.read_at === null,
  }));
}

export async function getUnreadCount(meId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', meId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function markAllRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read');
  if (error) throw error;
}
