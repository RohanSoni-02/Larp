import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { NavBar } from '@/src/components/Header';
import { IconButton } from '@/src/components/IconButton';
import { Screen } from '@/src/components/Screen';
import type { ConversationSummary } from '@/src/features/messages/api';
import { useConversations } from '@/src/features/messages/hooks';
import { formatRelativeTime } from '@/src/lib/format';
import { useNow } from '@/src/lib/useNow';
import { fonts, useTheme } from '@/src/theme';

function ConversationRow({ conversation, now }: { conversation: ConversationSummary; now: number }) {
  const { colors } = useTheme();
  const unread = conversation.unread > 0;
  const preview = conversation.lastBody ? `${conversation.lastFromMe ? 'You: ' : ''}${conversation.lastBody}` : '';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${conversation.otherName}${unread ? `, ${conversation.unread} unread` : ''}`}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.line }, pressed && { opacity: 0.6 }]}
    >
      <Avatar name={conversation.otherName} color={conversation.otherColor} size={48} />
      <View style={styles.rowText}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {conversation.otherName}
          </Text>
          {conversation.lastAt ? (
            <Text style={[styles.time, { color: unread ? colors.accentStrong : colors.subtle }]}>
              {formatRelativeTime(conversation.lastAt, now)}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.preview, unread ? { color: colors.ink, fontFamily: fonts.bodyBold } : { color: colors.muted }]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {unread ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { color: colors.accentInk }]}>
                {conversation.unread > 99 ? '99+' : conversation.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { data: conversations, isLoading } = useConversations();
  const now = useNow(60_000);
  const newMessage = () => router.push('/messages/new');

  return (
    <Screen
      scroll
      header={
        <NavBar
          onBack={() => router.back()}
          right={<IconButton name="edit" size={20} onPress={newMessage} accessibilityLabel="New message" />}
        />
      }
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Messages</Text>
      </View>
      {isLoading ? null : (conversations ?? []).length === 0 ? (
        <EmptyState
          icon="chat"
          title="No messages yet"
          body="Start a chat with someone you practise with."
          action={<Button title="New message" icon="edit" variant="secondary" size="sm" onPress={newMessage} />}
        />
      ) : (
        (conversations ?? []).map((c) => <ConversationRow key={c.id} conversation={c} now={now} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.2 },
  time: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  preview: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 19 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 11.5 },
});
