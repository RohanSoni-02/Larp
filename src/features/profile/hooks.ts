import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import {
  castVouch,
  completeOnboarding,
  getFollowCounts,
  getGlowups,
  getMyProfile,
  getMyStreak,
  getProfileByHandle,
  getProfileStats,
  getSuggestedPeople,
  getVouches,
  removeVouch,
  updateProfile,
  type OnboardingInput,
} from './api';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getMyProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useProfileByHandle(handle: string | undefined) {
  return useQuery({
    queryKey: ['profile-handle', handle],
    queryFn: () => getProfileByHandle(handle!),
    enabled: isSupabaseConfigured && Boolean(handle),
  });
}

export function useFollowCounts(userId: string | undefined) {
  const meId = useMeId();
  return useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: () => getFollowCounts(meId!, userId!),
    enabled: isSupabaseConfigured && Boolean(meId && userId),
  });
}

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: () => getProfileStats(userId!),
    enabled: isSupabaseConfigured && Boolean(userId),
  });
}

export function useMyStreak() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['streak', meId],
    queryFn: () => getMyStreak(meId!),
    enabled: isSupabaseConfigured && Boolean(meId),
  });
}

export function useVouches(userId: string | undefined) {
  const meId = useMeId();
  return useQuery({
    queryKey: ['vouches', userId],
    queryFn: () => getVouches(meId!, userId!),
    enabled: isSupabaseConfigured && Boolean(meId && userId),
  });
}

export function useGlowups(userId: string | undefined) {
  return useQuery({
    queryKey: ['glowups', userId],
    queryFn: () => getGlowups(userId!),
    enabled: isSupabaseConfigured && Boolean(userId),
  });
}

export function useSuggestedPeople(skillIds: string[], excludeUserId: string | undefined) {
  return useQuery({
    queryKey: ['suggested-people', skillIds.slice().sort(), excludeUserId],
    queryFn: () => getSuggestedPeople(skillIds, excludeUserId!),
    enabled: Boolean(excludeUserId) && skillIds.length > 0,
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardingInput) => completeOnboarding(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['profile', input.userId] });
    },
  });
}

export function useVouchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ voucheeId, skillId, undo }: { voucheeId: string; skillId: string; undo: boolean }) =>
      undo ? removeVouch(voucheeId, skillId) : castVouch(voucheeId, skillId),
    onSettled: (_d, _e, v) => {
      void qc.invalidateQueries({ queryKey: ['vouches', v.voucheeId] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: { display_name: string; bio: string } }) =>
      updateProfile(userId, input),
    onSettled: (_d, _e, v) => {
      void qc.invalidateQueries({ queryKey: ['profile', v.userId] });
    },
  });
}
