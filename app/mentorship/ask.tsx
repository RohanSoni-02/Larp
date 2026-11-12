import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { TierPill } from '@/src/components/TierPill';
import { useMentors, useRequestFeedback } from '@/src/features/mentorship/hooks';
import { fonts, useTheme } from '@/src/theme';
import { tierName } from '@/src/types/app';

const PROMPTS = ['Is my form right?', 'What should I drill next?', 'What am I doing wrong here?'];

export default function AskMentorScreen() {
  const { colors } = useTheme();
  const { skillId, sessionId } = useLocalSearchParams<{ skillId: string; sessionId?: string }>();
  const { data: mentors, isLoading } = useMentors(skillId);
  const request = useRequestFeedback();
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const send = () => {
    if (!mentorId || !message.trim()) return;
    request.mutate(
      { mentorId, skillId, sessionId: sessionId ?? null, message: message.trim() },
      {
        onSuccess: () => {
          Alert.alert('Request sent', 'You’ll get a notification when they reply.');
          router.replace('/mentorship');
        },
        onError: (e) => Alert.alert('Could not send', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Button title="Cancel" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      <Text style={[styles.title, { color: colors.ink }]}>Ask a mentor</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Mentors are Adept or Legit larpers who opted in to give feedback. They’ll see this session
        {sessionId ? ' and its clip' : ''}, even if it’s followers-only.
      </Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (mentors ?? []).length === 0 ? (
        <Card style={{ marginTop: 18 }}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No mentors yet for this skill</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            Once someone ahead of you opts in, they’ll show up here.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 8, marginTop: 16 }}>
          {(mentors ?? []).map((m) => {
            const selected = mentorId === m.userId;
            return (
              <Pressable
                key={m.userId}
                onPress={() => setMentorId(m.userId)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.mentor,
                  { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.line },
                ]}
              >
                <Avatar name={m.name} color={m.color} size={42} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.name, { color: colors.ink }]}>{m.name}</Text>
                    <TierPill tier={tierName(m.tier)} showDayOne={false} />
                  </View>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    @{m.handle} · {m.answered} {m.answered === 1 ? 'reply' : 'replies'} given
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? colors.primary : colors.line },
                    selected && { backgroundColor: colors.primary },
                  ]}
                >
                  {selected ? <Icon name="check" size={13} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[styles.label, { color: colors.muted }]}>Your question</Text>
      <View style={styles.prompts}>
        {PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setMessage(p)}
            style={[styles.prompt, { backgroundColor: colors.surface2, borderColor: colors.line }]}
          >
            <Text style={[styles.promptText, { color: colors.ink }]}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={message}
        onChangeText={setMessage}
        maxLength={500}
        multiline
        placeholder="What do you want them to look at?"
        placeholderTextColor={colors.muted}
        accessibilityLabel="Your question"
        style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.surface2, color: colors.ink }]}
      />
      <Text style={[styles.count, { color: colors.muted }]}>{message.length}/500</Text>

      <Button
        title="Send request"
        onPress={send}
        disabled={!mentorId || !message.trim() || request.isPending}
        loading={request.isPending}
        style={{ marginTop: 12 }}
      />
      <View style={{ height: 30 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 14, marginTop: 6, lineHeight: 20 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17 },
  mentor: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 22, letterSpacing: -0.15 },
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  prompt: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  promptText: { fontFamily: fonts.body, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 96,
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  count: { fontFamily: fonts.body, fontSize: 12, alignSelf: 'flex-end', marginTop: 4 },
});
