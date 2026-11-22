import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/features/auth/SessionProvider';
import { isSupabaseConfigured } from '@/src/lib/env';

import * as api from './api';
import type { ChatMessage, ConversationSummary } from './api';

function useMeId(): string | undefined {
  const { session } = useSession();
  return session?.user?.id;
}

export function useConversations() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['conversations'],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.listConversations(meId!),
    refetchInterval: 60_000,
  });
}

/** Conversations with something I haven't read — the inbox badge. */
export function useUnreadConversationCount(): number {
  const { data } = useConversations();
  return (data ?? []).filter((c) => c.unread > 0).length;
}

export function useChatPartner(conversationId: string | undefined) {
  const meId = useMeId();
  return useQuery({
    queryKey: ['chat-partner', conversationId],
    enabled: isSupabaseConfigured && Boolean(meId && conversationId),
    queryFn: () => api.getChatPartner(conversationId!, meId!),
    staleTime: Infinity,
  });
}

/** A thread's messages, oldest first. MessagesBridge streams new ones in. */
export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    enabled: isSupabaseConfigured && Boolean(conversationId),
    queryFn: () => api.getMessages(conversationId!),
    staleTime: 0,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const key = ['messages', conversationId];
  return useMutation({
    mutationFn: (message: ChatMessage) =>
      api.sendMessage({ id: message.id, conversationId, senderId: message.senderId, body: message.body }),
    onMutate: async (message) => {
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), { ...message, pending: true }]);
    },
    onSuccess: (_data, message) => {
      qc.setQueryData<ChatMessage[]>(key, (old) => {
        if (old?.some((m) => m.id === message.id && !m.pending)) return old;
        return api.mergeMessage(old ?? [], { ...message, pending: false });
      });
    },
    onError: (_error, message) => {
      qc.setQueryData<ChatMessage[]>(key, (old) => (old ?? []).filter((m) => m.id !== message.id));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => api.markConversationRead(conversationId),
    onSuccess: (_data, conversationId) => {
      qc.setQueryData<ConversationSummary[]>(['conversations'], (old) =>
        old?.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      );
    },
  });
}

export function useStartConversation() {
  return useMutation({ mutationFn: (userId: string) => api.startConversation(userId) });
}

export function useFollowing() {
  const meId = useMeId();
  return useQuery({
    queryKey: ['following', meId],
    enabled: isSupabaseConfigured && Boolean(meId),
    queryFn: () => api.listFollowing(meId!),
  });
}
