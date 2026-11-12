import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** An invite opened before sign-up; applied once the new user is onboarded. */
export type PendingInvite = { from: string; skill: string | null };

type InviteState = {
  pending: PendingInvite | null;
  setPending: (invite: PendingInvite | null) => void;
};

export const useInviteStore = create<InviteState>()(
  persist(
    (set) => ({
      pending: null,
      setPending: (pending) => set({ pending }),
    }),
    { name: 'larping-pending-invite', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
