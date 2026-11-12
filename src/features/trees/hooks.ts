import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useMyPortfolio() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['portfolio', meId],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getMyPortfolio(meId!),
  });
}

export function usePortfolio(userId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', userId],
    enabled: isSupabaseConfigured && Boolean(userId),
    queryFn: () => api.getPortfolio(userId!),
  });
}

export function useSkillTree(skillId: string | undefined) {
  const meId = useMeId();
  return useQuery({
    queryKey: ['tree', skillId],
    enabled: isSupabaseConfigured && Boolean(meId && skillId),
    queryFn: () => api.getSkillTree(meId!, skillId!),
  });
}

export function useNodeDetail(nodeId: string | undefined) {
  const meId = useMeId();
  return useQuery({
    queryKey: ['node', nodeId],
    enabled: isSupabaseConfigured && Boolean(meId && nodeId),
    queryFn: () => api.getNodeDetail(meId!, nodeId!),
  });
}

export function useMarkNodeInProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => api.markNodeInProgress(nodeId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['tree'] });
      void qc.invalidateQueries({ queryKey: ['node'] });
    },
  });
}
