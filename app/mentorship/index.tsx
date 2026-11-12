import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { Seg } from '@/src/components/Seg';
import { VideoProof } from '@/src/components/VideoProof';
import { useSignedUrl } from '@/src/features/media/api';
import type { FeedbackThread } from '@/src/features/mentorship/api';
import { useFeedbackThreads, useRespondFeedback } from '@/src/features/mentorship/hooks';
import { formatRelativeTime } from '@/src/lib/format';
import { fonts, useTheme } from '@/src/theme';

export default function MentorshipScreen() {
  const { colors } = useTheme();
  const { data: threads, isLoading } = useFeedbackThreads();
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');

  const all = threads ?? [];
  const pendingInbox = all.filter((t) => t.direction === 'inbox' && t.status === 'pending').length;
  const shown = all.filter((t) => t.direction === tab);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Mentorship</Text>
        <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Ask people ahead of you for feedback, or help the ones behind you.
      </Text>
      <View style={{ marginTop: 14 }}>
        <Seg
          options={[
            { value: 'inbox', label: pendingInbox > 0 ? `Inbox · ${pendingInbox}` : 'Inbox' },
            { value: 'sent', label: 'Asked' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : shown.length === 0 ? (
        <Card style={{ marginTop: 16, alignItems: 'center', paddingVertical: 26 }}>
          <Text style={{ fontSize: 32 }}>🎓</Text>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>
            {tab === 'inbox' ? 'No requests yet' : 'You haven’t asked anyone yet'}
          </Text>
          <Text style={[styles.sub, { color: colors.muted, textAlign: 'center' }]}>
            {tab === 'inbox'
              ? 'Reach Adept in a skill and turn on “Open to feedback” from your profile.'
              : 'Tap “Ask a mentor” on one of your sessions to get feedback.'}
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 12, marginTop: 16 }}>
          {shown.map((t) => (
            <ThreadCard key={t.id} thread={t} />
          ))}
        </View>
      )}
      <View style={{ height: 30 }} />
    </Screen>
  );
}

function SessionSnapshot({ thread }: { thread: FeedbackThread }) {
  const { colors } = useTheme();
  const url = useSignedUrl(thread.session?.media?.key ?? null);
  if (!thread.session) return null;
  const media = thread.session.media;
  return (
    <View style={[styles.snapshot, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
      {url && media?.kind === 'video' ? (
        <VideoProof uri={url} initialSpeed={0.5} style={styles.snapMedia} />
      ) : url ? (
        <Image source={{ uri: url }} style={[styles.snapMedia, { aspectRatio: 4 / 3 }]} />
      ) : null}
      <View style={{ padding: 10 }}>
        <Text style={[styles.snapTitle, { color: colors.ink }]}>
          {thread.session.minutes} min{thread.session.label ? ` · ${thread.session.label}` : ''}
        </Text>
        {thread.session.note ? (
          <Text style={[styles.snapNote, { color: colors.muted }]}>“{thread.session.note}”</Text>
        ) : null}
      </View>
    </View>
  );
}

function ThreadCard({ thread }: { thread: FeedbackThread }) {
  const { colors } = useTheme();
  const respond = useRespondFeedback();
  const [reply, setReply] = useState('');
  const canReply = thread.direction === 'inbox' && thread.status === 'pending';

  const statusColor =
    thread.status === 'answered' ? colors.good : thread.status === 'declined' ? colors.muted : colors.gold;

  const submit = (decline: boolean) =>
    respond.mutate(
      { id: thread.id, response: reply, decline },
      { onError: (e) => Alert.alert('Could not send', e instanceof Error ? e.message : 'Try again.') },
    );

  return (
    <Card>
      <Pressable
        style={styles.threadHead}
        onPress={() => router.push({ pathname: '/user/[id]', params: { id: thread.otherId } })}
      >
        <Avatar name={thread.otherName} color={thread.otherColor} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.ink }]}>
            {thread.direction === 'inbox' ? thread.otherName : `To ${thread.otherName}`}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {thread.skillName} · {formatRelativeTime(thread.createdAt)}
          </Text>
        </View>
        <View style={[styles.status, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{thread.status}</Text>
        </View>
      </Pressable>

      <Text style={[styles.message, { color: colors.ink }]}>{thread.message}</Text>
      <SessionSnapshot thread={thread} />

      {thread.response ? (
        <View style={[styles.response, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.responseLabel, { color: colors.primary }]}>
            {thread.direction === 'inbox' ? 'Your feedback' : `${thread.otherName.split(' ')[0]}’s feedback`}
          </Text>
          <Text style={[styles.responseText, { color: colors.ink }]}>{thread.response}</Text>
        </View>
      ) : null}

      {canReply ? (
        <>
          <TextInput
            value={reply}
            onChangeText={setReply}
            multiline
            maxLength={2000}
            placeholder="What’s working, and one thing to fix next…"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Your feedback"
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
          />
          <View style={styles.replyRow}>
            <Button title="Decline" variant="ghost" size="sm" onPress={() => submit(true)} disabled={respond.isPending} />
            <Button
              title="Send feedback"
              size="sm"
              onPress={() => submit(false)}
              disabled={!reply.trim() || respond.isPending}
              loading={respond.isPending}
            />
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 28 },
  sub: { fontFamily: fonts.body, fontSize: 14, marginTop: 4, lineHeight: 19 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, marginTop: 8 },
  threadHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 11.5, textTransform: 'capitalize' },
  message: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, marginTop: 12 },
  snapshot: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 10 },
  snapMedia: { width: '100%' },
  snapTitle: { fontFamily: fonts.bodyBold, fontSize: 14 },
  snapNote: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  response: { borderRadius: 14, padding: 12, marginTop: 10 },
  responseLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15 },
  responseText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  replyRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
});
