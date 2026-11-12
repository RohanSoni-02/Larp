import { create } from 'zustand';

/** Local-only UI state (server state lives in TanStack Query). */
type UiState = {
  feedTab: 'following' | 'foryou';
  setFeedTab: (tab: 'following' | 'foryou') => void;
  treeSkillId: string | null;
  setTreeSkillId: (id: string | null) => void;
  /** Story groups seen today: `${dayKey}:${userId}`. */
  storySeen: Record<string, true>;
  markStorySeen: (key: string) => void;
  /** Co-op rooms joined quietly (local until Realtime presence, Phase 6). */
  joinedRooms: Record<string, true>;
  joinRoom: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  feedTab: 'following',
  setFeedTab: (feedTab) => set({ feedTab }),
  treeSkillId: null,
  setTreeSkillId: (treeSkillId) => set({ treeSkillId }),
  storySeen: {},
  markStorySeen: (key) => set((s) => ({ storySeen: { ...s.storySeen, [key]: true } })),
  joinedRooms: {},
  joinRoom: (id) => set((s) => ({ joinedRooms: { ...s.joinedRooms, [id]: true } })),
}));
