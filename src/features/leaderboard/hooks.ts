import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

export function useLeaderboard(scope: api.LeaderboardScope) {
  return useQuery({
    queryKey: ['leaderboard', scope.skillId ?? null, scope.guildId ?? null, Boolean(scope.followingOnly), scope.days],
    enabled: isSupabaseConfigured && Boolean(scope.skillId || scope.guildId),
    queryFn: () => api.getLeaderboard(scope),
  });
}

export function useMyGuildIds() {
  const { session } = useSession();
  const meId = session?.user?.id;
  return useQuery({
    queryKey: ['guild-members', meId],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getMyGuildIds(meId!),
  });
}

export function useSetGuildMember() {
  const { session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guildId, join }: { guildId: string; join: boolean }) =>
      api.setGuildMember(session!.user.id, guildId, join),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['guild-members'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useSetShowOnLeaderboards() {
  const { session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (show: boolean) => api.setShowOnLeaderboards(session!.user.id, show),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['profile'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
