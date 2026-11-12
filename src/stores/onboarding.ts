import { create } from 'zustand';

/** Local UI state for the onboarding wizard (server state stays in Supabase). */
type OnboardingDraft = {
  displayName: string;
  selectedSkillIds: string[];
  followUserIds: string[];
  reminderTime: string | null;
  setDisplayName: (name: string) => void;
  toggleSkill: (skillId: string) => void;
  toggleFollow: (userId: string) => void;
  setReminderTime: (time: string | null) => void;
  reset: () => void;
};

const initialState = {
  displayName: '',
  selectedSkillIds: [] as string[],
  followUserIds: [] as string[],
  reminderTime: '18:00' as string | null,
};

export const useOnboardingStore = create<OnboardingDraft>()((set) => ({
  ...initialState,
  setDisplayName: (displayName) => set({ displayName }),
  toggleSkill: (skillId) =>
    set((state) => ({
      selectedSkillIds: state.selectedSkillIds.includes(skillId)
        ? state.selectedSkillIds.filter((id) => id !== skillId)
        : [...state.selectedSkillIds, skillId],
    })),
  toggleFollow: (userId) =>
    set((state) => ({
      followUserIds: state.followUserIds.includes(userId)
        ? state.followUserIds.filter((id) => id !== userId)
        : [...state.followUserIds, userId],
    })),
  setReminderTime: (reminderTime) => set({ reminderTime }),
  reset: () => set(initialState),
}));
