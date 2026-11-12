import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

export function useTodayWindow() {
  const { session } = useSession();
  const meId = session?.user?.id;
  return useQuery({
    queryKey: ['larp-window', meId],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getTodayWindow(meId!),
    refetchInterval: 30_000,
  });
}

export function useLarpCheckPrefs() {
  const { session } = useSession();
  const meId = session?.user?.id;
  return useQuery({
    queryKey: ['larp-check-prefs', meId],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getLarpCheckPrefs(meId!),
  });
}

export function useSaveLarpCheckPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveLarpCheckPrefs,
    onSettled: () => qc.invalidateQueries({ queryKey: ['larp-check-prefs'] }),
  });
}

export function useMyCheck(windowId: string | undefined) {
  const { session } = useSession();
  const meId = session?.user?.id;
  return useQuery({
    queryKey: ['my-larp-check', windowId],
    enabled: isSupabaseConfigured && Boolean(meId && windowId),
    queryFn: () => api.getMyCheck(meId!, windowId!),
  });
}

export function usePostLarpCheck() {
  const { session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { windowId: string; skillId: string; workUri: string; selfieUri: string }) =>
      api.postLarpCheck(session!.user.id, input),
    onSettled: () => qc.invalidateQueries(),
  });
}

export function useTriggerLarpCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.triggerLarpCheckNow(),
    onSettled: () => qc.invalidateQueries({ queryKey: ['larp-window'] }),
  });
}
