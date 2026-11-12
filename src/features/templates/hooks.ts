import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

export function useMyTemplates() {
  return useQuery({
    queryKey: ['templates'],
    enabled: isSupabaseConfigured,
    queryFn: () => api.getMyTemplates(),
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveTemplate,
    onSettled: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTemplate,
    onSettled: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}
