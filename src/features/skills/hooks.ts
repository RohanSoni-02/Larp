import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import { addSkillToPortfolio, groupByCategory, listApprovedSkills, listUsableSkills } from './api';
import { createCustomSkill, type CreateSkillInput } from './catalog';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useSkills() {
  return useQuery({ queryKey: ['skills', 'approved'], queryFn: listApprovedSkills, staleTime: Infinity });
}

export function useSkillGroups() {
  const query = useSkills();
  return { ...query, groups: query.data ? groupByCategory(query.data) : [] };
}

/** Approved skills + my pending customs (for session/trees pickers). */
export function useUsableSkills() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['skills', 'usable', meId],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => listUsableSkills(meId!),
  });
}

export function useAddSkillToPortfolio() {
  const meId = useMeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => addSkillToPortfolio(meId!, skillId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['portfolio'] });
      void qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useCreateCustomSkill() {
  const meId = useMeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSkillInput) => createCustomSkill(meId!, input),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}
