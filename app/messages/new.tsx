import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { EmptyState } from '@/src/components/EmptyState';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useSearchPeople } from '@/src/features/explore/hooks';
import type { ChatPerson } from '@/src/features/messages/api';
import { useFollowing, useStartConversation } from '@/src/features/messages/hooks';
import { fonts, useTheme } from '@/src/theme';

export default function NewMessageScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const meId = session?.user?.id;
  const [query, setQuery] = useState('');
  const search = query.trim().replace(/^@/, '');
  const { data: results } = useSearchPeople(search);
  const { data: following } = useFollowing();
  const start = useStartConversation();
  const [opening, setOpening] = useState<string | null>(null);

  const people: ChatPerson[] = (
    search ? (results ?? []).map((r) => ({ id: r.id, handle: r.handle, name: r.name, color: r.color })) : (following ?? [])
  ).filter((p) => p.id !== meId);

  const open = (person: ChatPerson) => {
    if (opening) return;
    setOpening(person.id);
    start.mutate(person.id, {
      onSuccess: (conversationId) => router.replace({ pathname: '/messages/[id]', params: { id: conversationId } }),
      onError: (e) => Alert.alert('Could not start chat', e instanceof Error ? e.message : 'Try again.'),
      onSettled: () => setOpening(null),
    });
  };

  return (
    <Screen scroll header={<NavBar title="New message" onClose={() => router.back()} />}>
      <Field
        label="To"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or @handle"
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={[styles.section, { color: colors.muted }]}>{search ? 'People' : 'People you follow'}</Text>
      {people.length === 0 ? (
        <EmptyState
          compact
          icon="people"
          title={search ? 'No one found' : 'You’re not following anyone yet'}
          body={search ? 'Try another name or handle.' : 'Search for someone above to start a chat.'}
        />
      ) : (
        people.map((person) => (
          <Pressable
            key={person.id}
            onPress={() => open(person)}
            disabled={Boolean(opening)}
            accessibilityRole="button"
            accessibilityLabel={`Message ${person.name}`}
            style={({ pressed }) => [styles.row, { borderBottomColor: colors.line }, pressed && { opacity: 0.6 }]}
          >
            <Avatar name={person.name} color={person.color} size={42} />
            <View style={styles.rowText}>
              <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={[styles.handle, { color: colors.muted }]} numberOfLines={1}>
                @{person.handle}
              </Text>
            </View>
            {opening === person.id ? <ActivityIndicator color={colors.muted} /> : null}
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 4, marginBottom: 4, letterSpacing: -0.05 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.2 },
  handle: { fontFamily: fonts.body, fontSize: 13, marginTop: 1 },
});
