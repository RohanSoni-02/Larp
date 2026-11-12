import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { Screen } from '@/src/components/Screen';
import { Skeleton } from '@/src/components/Skeleton';
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
    <Screen
      scroll
      header={<NavBar onClose={() => router.back()} />}
      footer={
        <Button
          title="Send request"
          icon="send"
          size="lg"
          onPress={send}
          disabled={!mentorId || !message.trim() || request.isPending}
          loading={request.isPending}
        />
      }
    >
      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        Ask a mentor
      </Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Mentors are Adept or Legit larpers who opted in to give feedback. They’ll see this session
        {sessionId ? ' and its clip' : ''}, even if it’s followers-only.
      </Text>

      {isLoading ? (
        <View style={{ gap: 8, marginTop: 16 }} accessibilityLabel="Loading mentors">
          <Skeleton height={68} radius={18} />
          <Skeleton height={68} radius={18} />
        </View>
      ) : (mentors ?? []).length === 0 ? (
        <EmptyState compact icon="mentor" title="No mentors yet for this skill" body="Once someone ahead of you opts in, they’ll show up here." />
      ) : (
        <View style={{ gap: 8, marginTop: 16 }}>
          {(mentors ?? []).map((m) => {
            const selected = mentorId === m.userId;
            return (
              <PressableScale
                key={m.userId}
                scale={0.98}
                onPress={() => setMentorId(m.userId)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${m.name}, ${tierName(m.tier)}`}
                style={[
                  styles.mentor,
                  { backgroundColor: selected ? colors.accentSoft : colors.surface2, borderColor: selected ? colors.accent : 'transparent' },
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
                    { borderColor: selected ? colors.accent : colors.subtle },
                    selected && { backgroundColor: colors.accent },
                  ]}
                >
                  {selected ? <Icon name="check" size={13} color={colors.accentInk} weight="bold" /> : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
      )}

      <Text style={[styles.label, { color: colors.muted }]}>Your question</Text>
      <View style={styles.prompts}>
        {PROMPTS.map((p) => (
          <Chip key={p} size="sm" label={p} selected={message === p} onPress={() => setMessage(p)} />
        ))}
      </View>
      <TextInput
        value={message}
        onChangeText={setMessage}
        maxLength={500}
        multiline
        placeholder="What do you want them to look at?"
        placeholderTextColor={colors.subtle}
        selectionColor={colors.accent}
        accessibilityLabel="Your question"
        style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.surface2, color: colors.ink }]}
      />
      <Text style={[styles.count, { color: colors.subtle }]}>{message.length}/500</Text>

    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 14.5, marginTop: 8, lineHeight: 21 },
  mentor: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1.5 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 22, letterSpacing: -0.15 },
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 104,
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  count: { fontFamily: fonts.body, fontSize: 12, alignSelf: 'flex-end', marginTop: 4 },
});
