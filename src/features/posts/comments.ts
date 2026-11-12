import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';
import { supabase } from '@/src/lib/supabase';
import type { CommentRow } from '@/src/types/app';

 

function mapComment(row: any): CommentRow {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.profiles?.display_name ?? 'Larper',
    authorColor: row.profiles?.avatar_color ?? '#5B3DF5',
    parentId: row.parent_id,
    body: row.body,
    at: row.created_at,
  };
}

export function useComments(postId: string, kind: 'session' | 'larp_check') {
  return useQuery({
    queryKey: ['comments', postId],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const column = kind === 'session' ? 'session_id' : 'larp_check_id';
      const { data, error } = await supabase
        .from('comments')
        .select('id, author_id, parent_id, body, created_at, profiles!comments_author_id_fkey ( display_name, avatar_color )')
        .eq(column, postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapComment);
    },
  });
}

export function useAddComment(postId: string, kind: 'session' | 'larp_check') {
  const { session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string | null }) => {
      const target = kind === 'session' ? { session_id: postId } : { larp_check_id: postId };
      const { error } = await supabase
        .from('comments')
        .insert({ author_id: session!.user.id, body, parent_id: parentId ?? null, ...target });
      if (error) throw error;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['comments', postId] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
