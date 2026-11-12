import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { cancelBlockAlerts, scheduleBlockAlerts } from '@/src/features/templates/alerts';
import type { SessionPlan } from '@/src/features/templates/blocks';

/**
 * The in-progress practice session. Persisted to AsyncStorage so a session
 * survives the app being backgrounded or killed, and syncs when back online.
 */
export type ActiveSession = {
  clientUuid: string;
  skillId: string;
  nodeId: string | null;
  label: string;
  roomId: string | null;
  /** Wall-clock ms when the current running stretch began (null when paused). */
  runningSince: number | null;
  /** Seconds banked while paused. */
  accumulatedSec: number;
  note: string;
  localMedia: { uri: string; kind: 'image' | 'video'; durationMs?: number | null } | null;
  landed: boolean;
  visibility: 'public' | 'followers' | 'private';
  plan?: SessionPlan | null;
};

type SessionState = {
  active: ActiveSession | null;
  begin: (init: {
    skillId: string;
    nodeId?: string | null;
    label?: string;
    roomId?: string | null;
    plan?: SessionPlan | null;
  }) => void;
  toggle: () => void;
  addTenMinutes: () => void;
  setSkill: (skillId: string) => void;
  setNode: (nodeId: string | null) => void;
  setNote: (note: string) => void;
  setMedia: (media: ActiveSession['localMedia']) => void;
  setLanded: (landed: boolean) => void;
  setVisibility: (v: ActiveSession['visibility']) => void;
  setPlan: (plan: SessionPlan | null) => void;
  discard: () => void;
};

export function elapsedSec(active: ActiveSession | null, now = Date.now()): number {
  if (!active) return 0;
  return active.accumulatedSec + (active.runningSince ? (now - active.runningSince) / 1000 : 0);
}

/** Re-sync the local block-boundary notifications with the session's state. */
function syncAlerts(active: ActiveSession | null): void {
  if (active?.plan && active.runningSince) void scheduleBlockAlerts(active.plan, elapsedSec(active));
  else void cancelBlockAlerts();
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => {
      const update = (fn: (a: ActiveSession) => ActiveSession, resync = false) => {
        const current = get().active;
        if (!current) return;
        const next = fn(current);
        set({ active: next });
        if (resync) syncAlerts(next);
      };
      return {
        active: null,
        begin: ({ skillId, nodeId = null, label = '', roomId = null, plan = null }) => {
          const active: ActiveSession = {
            clientUuid: globalThis.crypto.randomUUID(),
            skillId,
            nodeId,
            label,
            roomId,
            runningSince: Date.now(),
            accumulatedSec: 0,
            note: '',
            localMedia: null,
            landed: false,
            visibility: 'public',
            plan,
          };
          set({ active });
          syncAlerts(active);
        },
        toggle: () =>
          update(
            (a) =>
              a.runningSince
                ? { ...a, accumulatedSec: elapsedSec(a), runningSince: null }
                : { ...a, runningSince: Date.now() },
            true,
          ),
        addTenMinutes: () => update((a) => ({ ...a, accumulatedSec: a.accumulatedSec + 600 }), true),
        setSkill: (skillId) => update((a) => ({ ...a, skillId, nodeId: null, landed: false })),
        setNode: (nodeId) => update((a) => ({ ...a, nodeId, landed: false })),
        setNote: (note) => update((a) => ({ ...a, note })),
        setMedia: (localMedia) => update((a) => ({ ...a, localMedia })),
        setLanded: (landed) => update((a) => ({ ...a, landed })),
        setVisibility: (visibility) => update((a) => ({ ...a, visibility })),
        setPlan: (plan) => update((a) => ({ ...a, plan }), true),
        discard: () => {
          set({ active: null });
          void cancelBlockAlerts();
        },
      };
    },
    {
      name: 'larping-active-session',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
