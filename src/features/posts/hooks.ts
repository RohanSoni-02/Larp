import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';
import type { FeedPost } from '@/src/types/app';

import * as api from './api';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useFeed() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['feed'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getFeed(meId!),
  });
}

export function usePost(id: string, kind: 'session' | 'larp_check') {
  const meId = useMeId();
  return useQuery({
    queryKey: ['post', id],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getPost(meId!, id, kind),
  });
}

export function useStoryPosts() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['stories'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getStoryGroups(meId!),
  });
}

export function useUserPosts(userId: string | undefined) {
  const meId = useMeId();
  return useQuery({
    queryKey: ['user-posts', userId],
    enabled: isSupabaseConfigured && Boolean(meId && userId),
    queryFn: () => api.getUserPosts(meId!, userId!),
  });
}

/** Invalidate everything that displays posts. */
function useInvalidatePosts() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['feed'] }),
      qc.invalidateQueries({ queryKey: ['post'] }),
      qc.invalidateQueries({ queryKey: ['stories'] }),
      qc.invalidateQueries({ queryKey: ['user-posts'] }),
      qc.invalidateQueries({ queryKey: ['explore'] }),
    ]);
}

export function useToggleKudo() {
  const meId = useMeId();
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ post, label, on }: { post: FeedPost; label: string; on: boolean }) =>
      api.toggleKudo(meId!, post, label, on),
    onSettled: invalidate,
  });
}

export function useToggleSave() {
  const meId = useMeId();
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ post, on }: { post: FeedPost; on: boolean }) => api.toggleSave(meId!, post, on),
    onSettled: invalidate,
  });
}

export function useSetFollowing() {
  const meId = useMeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      api.setFollowing(meId!, userId, follow),
    onSettled: () => qc.invalidateQueries(),
  });
}
