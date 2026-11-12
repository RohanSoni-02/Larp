import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useSearchPeople(query: string) {
  return useQuery({
    queryKey: ['explore', 'search', query],
    enabled: isSupabaseConfigured && query.trim().length > 0,
    queryFn: () => api.searchPeople(query),
  });
}

export function usePopularSessions(skillId: string | null, query: string) {
  return useQuery({
    queryKey: ['explore', 'popular', skillId, query],
    enabled: isSupabaseConfigured,
    queryFn: () => api.getPopularSessions(skillId, query),
  });
}

export function useQuests() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['explore', 'quests'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getQuests(meId!),
  });
}

export function useStandards() {
  return useQuery({
    queryKey: ['explore', 'standards'],
    enabled: isSupabaseConfigured,
    queryFn: () => api.getStandards(),
  });
}

export function useRooms() {
  return useQuery({
    queryKey: ['explore', 'rooms'],
    enabled: isSupabaseConfigured,
    queryFn: () => api.getRooms(),
    refetchInterval: 60_000,
  });
}

export function useGuilds() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['explore', 'guilds'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.getGuilds(meId!),
  });
}

export function useSetQuestJoined() {
  const meId = useMeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questId, join }: { questId: string; join: boolean }) =>
      api.setQuestJoined(meId!, questId, join),
    onSettled: () => qc.invalidateQueries({ queryKey: ['explore'] }),
  });
}

export function useSetRsvp() {
  const meId = useMeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, going }: { eventId: string; going: boolean }) =>
      api.setRsvp(meId!, eventId, going),
    onSettled: () => qc.invalidateQueries({ queryKey: ['explore'] }),
  });
}

export function useLeaderboard(params: {
  skillId?: string | null;
  guildId?: string | null;
  followingOnly?: boolean;
  days?: number;
}) {
  return useQuery({
    queryKey: [
      'explore',
      'leaderboard',
      params.skillId ?? null,
      params.guildId ?? null,
      Boolean(params.followingOnly),
      params.days ?? 7,
    ],
    queryFn: () => api.getLeaderboard(params),
  });
}
