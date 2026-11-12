import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

export function useMentors(skillId: string | undefined) {
  return useQuery({
    queryKey: ['mentors', skillId],
    enabled: isSupabaseConfigured && Boolean(skillId),
    queryFn: () => api.listMentors(skillId!),
  });
}

export function useFeedbackThreads() {
  return useQuery({
    queryKey: ['feedback-threads'],
    enabled: isSupabaseConfigured,
    queryFn: () => api.getFeedbackThreads(),
  });
}

export function useRequestFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.requestFeedback,
    onSettled: () => qc.invalidateQueries({ queryKey: ['feedback-threads'] }),
  });
}

export function useRespondFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response, decline }: { id: string; response: string; decline?: boolean }) =>
      api.respondFeedback(id, response, decline),
    onSettled: () => qc.invalidateQueries({ queryKey: ['feedback-threads'] }),
  });
}

export function useSetOpenToFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, open }: { skillId: string; open: boolean }) => api.setOpenToFeedback(skillId, open),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['portfolio'] });
      void qc.invalidateQueries({ queryKey: ['mentors'] });
    },
  });
}
