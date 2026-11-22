import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputKeyPressEvent,
} from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import type { ChatMessage } from '@/src/features/messages/api';
import { useChatPartner, useMarkConversationRead, useMessages, useSendMessage } from '@/src/features/messages/hooks';
import { dayKey, formatTime } from '@/src/lib/format';
import { fonts, GUTTER, useTheme } from '@/src/theme';

/** Messages from one person closer together than this share a bubble group. */
const GROUP_GAP_MS = 5 * 60 * 1000;
const MAX_LENGTH = 2000;

type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage; mine: boolean; first: boolean; last: boolean };

function dayLabel(iso: string): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = dayKey(iso);
  if (key === dayKey(new Date())) return 'Today';
  if (key === dayKey(yesterday)) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildRows(messages: ChatMessage[], meId: string | undefined): Row[] {
  const rows: Row[] = [];
  const joins = (a: ChatMessage | undefined, b: ChatMessage | undefined) =>
    Boolean(a && b && a.senderId === b.senderId && dayKey(a.at) === dayKey(b.at) && Date.parse(b.at) - Date.parse(a.at) < GROUP_GAP_MS);
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || dayKey(prev.at) !== dayKey(message.at)) {
      rows.push({ kind: 'day', key: `day-${dayKey(message.at)}`, label: dayLabel(message.at) });
    }
    rows.push({
      kind: 'message',
      key: message.id,
      message,
      mine: message.senderId === meId,
      first: !joins(prev, message),
      last: !joins(message, next),
    });
  });
  return rows;
}

function Bubble({ message, mine, first, last }: { message: ChatMessage; mine: boolean; first: boolean; last: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine, first && styles.groupStart]}>
      <View
        style={[
          styles.bubble,
          mine
            ? [{ backgroundColor: colors.accent }, last && styles.tailMine]
            : [{ backgroundColor: colors.surface2 }, last && styles.tailTheirs],
          message.pending && styles.pending,
        ]}
      >
        <Text selectable style={[styles.bubbleText, { color: mine ? colors.accentInk : colors.ink }]}>
          {message.body}
        </Text>
      </View>
      {last ? (
        <Text style={[styles.bubbleMeta, { color: colors.subtle }]}>
          {message.pending ? 'Sending…' : formatTime(message.at)}
        </Text>
      ) : null}
    </View>
  );
}

export default function ConversationScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const meId = session?.user?.id;
  const { data: partner } = useChatPartner(id);
  const { data: messages, isLoading } = useMessages(id);
  const send = useSendMessage(id!);
  const { mutate: markRead } = useMarkConversationRead();
  const [body, setBody] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrolledOnce = useRef(false);

  const rows = useMemo(() => buildRows(messages ?? [], meId), [messages, meId]);
  const latestFromThem = useMemo(() => {
    const list = messages ?? [];
    for (let i = list.length - 1; i >= 0; i--) if (list[i]!.senderId !== meId) return list[i]!.id;
    return undefined;
  }, [messages, meId]);

  useEffect(() => {
    if (id && latestFromThem) markRead(id);
  }, [id, latestFromThem, markRead]);

  const submit = () => {
    const text = body.trim();
    if (!text || !meId || !id) return;
    setBody('');
    send
      .mutateAsync({ id: globalThis.crypto.randomUUID(), senderId: meId, body: text, at: new Date().toISOString() })
      .catch((e: unknown) => {
        setBody((current) => current || text);
        Alert.alert('Message not sent', e instanceof Error ? e.message : 'Try again.');
      });
  };

  // Web: Enter sends, Shift+Enter adds a line.
  const onKeyPress = (e: TextInputKeyPressEvent) => {
    if (Platform.OS !== 'web') return;
    const key = e.nativeEvent as TextInputKeyPressEvent['nativeEvent'] & { shiftKey?: boolean; isComposing?: boolean };
    if (key.key === 'Enter' && !key.shiftKey && !key.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const scrollToEnd = () => {
    scrollRef.current?.scrollToEnd({ animated: scrolledOnce.current });
    scrolledOnce.current = true;
  };

  const firstName = partner?.name.split(' ')[0];
  const canSend = Boolean(body.trim()) && Boolean(meId);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        padded={false}
        header={
          <NavBar
            title={partner?.name}
            onBack={() => router.back()}
            divider
            right={
              partner ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: partner.id } })}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${partner.name}’s profile`}
                >
                  <Avatar name={partner.name} color={partner.color} size={30} />
                </Pressable>
              ) : undefined
            }
          />
        }
        footer={
          <View style={[styles.inputRow, { backgroundColor: colors.surface2 }]}>
            <TextInput
              value={body}
              onChangeText={setBody}
              onKeyPress={onKeyPress}
              placeholder={firstName ? `Message ${firstName}…` : 'Message…'}
              placeholderTextColor={colors.subtle}
              selectionColor={colors.accent}
              style={[styles.input, { color: colors.ink }]}
              multiline
              maxLength={MAX_LENGTH}
              accessibilityLabel="Message text"
            />
            <PressableScale
              onPress={submit}
              scale={0.9}
              disabled={!canSend}
              disabledOpacity={0.35}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={[styles.send, { backgroundColor: colors.accent }]}
            >
              <Icon name="send" size={17} color={colors.accentInk} weight="bold" />
            </PressableScale>
          </View>
        }
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
        >
          {!isLoading && rows.length === 0 && partner ? (
            <View style={styles.intro}>
              <Avatar name={partner.name} color={partner.color} size={72} />
              <Text style={[styles.introName, { color: colors.ink }]}>{partner.name}</Text>
              <Text style={[styles.introHandle, { color: colors.muted }]}>@{partner.handle}</Text>
              <Text style={[styles.introHint, { color: colors.muted }]}>Say hi and swap practice tips.</Text>
            </View>
          ) : null}
          {rows.map((row) =>
            row.kind === 'day' ? (
              <Text key={row.key} style={[styles.day, { color: colors.subtle }]}>
                {row.label}
              </Text>
            ) : (
              <Bubble key={row.key} message={row.message} mine={row.mine} first={row.first} last={row.last} />
            ),
          )}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  thread: { paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 12, flexGrow: 1, justifyContent: 'flex-end' },
  intro: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  introName: { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4, marginTop: 10 },
  introHandle: { fontFamily: fonts.body, fontSize: 14 },
  introHint: { fontFamily: fonts.body, fontSize: 14, marginTop: 10 },
  day: { alignSelf: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 18, marginBottom: 4 },
  bubbleRow: { alignItems: 'flex-start', marginTop: 3 },
  bubbleRowMine: { alignItems: 'flex-end' },
  groupStart: { marginTop: 12 },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  tailMine: { borderBottomRightRadius: 6 },
  tailTheirs: { borderBottomLeftRadius: 6 },
  pending: { opacity: 0.6 },
  bubbleText: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: 21 },
  bubbleMeta: { fontFamily: fonts.body, fontSize: 11.5, marginTop: 4, marginHorizontal: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15.5, minHeight: 36, maxHeight: 120, paddingVertical: 8 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
