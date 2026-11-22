import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { isSupabaseConfigured } from '@/src/lib/env';
import { supabase } from '@/src/lib/supabase';

import { mapMessage, mergeMessage, type ChatMessage } from './api';

/**
 * One realtime subscription for the whole app. RLS only delivers messages from
 * my own conversations; each lands in its open thread and refreshes the inbox.
 */
export function MessagesBridge({ userId }: { userId: string | undefined }) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as { conversation_id: string };
        qc.setQueryData<ChatMessage[]>(['messages', row.conversation_id], (old) =>
          old ? mergeMessage(old, mapMessage(row)) : old,
        );
        void qc.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return null;
}
