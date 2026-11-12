import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useActivity() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['activity'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getActivity(meId!),
  });
}

export function useUnreadCount() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['activity-unread'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getUnreadCount(meId!),
    refetchInterval: 60_000,
  });
}

export function useMarkActivityRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllRead(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['activity'] });
      void qc.invalidateQueries({ queryKey: ['activity-unread'] });
    },
  });
}
