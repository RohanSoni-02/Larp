import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { useActivity, useMarkActivityRead } from '@/src/features/activity/hooks';
import { formatTime } from '@/src/lib/format';
import { fonts, useTheme } from '@/src/theme';
import type { ActivityItem } from '@/src/types/app';

function copy(item: ActivityItem): string {
  const name = item.actorName ?? 'Someone';
  switch (item.type) {
    case 'follow':
      return `${name} started following you`;
    case 'kudo':
      return `${name} gave you kudos: “${String(item.data.label ?? '')}”`;
    case 'comment':
      return `${name} commented: “${String(item.data.body ?? '')}”`;
    case 'tier_up':
      return `You reached ${String(item.data.tier_name ?? 'a new tier')} in ${String(item.data.skill_name ?? 'a skill')}`;
    case 'level_up':
      return `Larper level ${String(item.data.level ?? '')} — keep going`;
    case 'larp_check':
      return '⚡ Larp Check is live. Two minutes.';
    case 'system': {
      const skill = String(item.data.skill_name ?? 'a skill');
      if (item.data.kind === 'feedback_request') return `🎓 ${name} asked for your feedback on ${skill}`;
      if (item.data.kind === 'feedback_answered') return `🎓 ${name} answered your ${skill} question`;
      if (item.data.kind === 'feedback_declined') return `${name} can’t review your ${skill} session right now`;
      return String(item.data.body ?? 'Update from Larping');
    }
    default:
      return `${name} did something`;
  }
}

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { data: items } = useActivity();
  const markRead = useMarkActivityRead();

  useEffect(() => {
    if ((items ?? []).some((i) => i.unread)) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items?.length]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Activity</Text>
        <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      {(items ?? []).length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>Nothing yet. Post a session and the kudos will come.</Text>
      ) : (
        (items ?? []).map((item) => (
          <Pressable
            key={item.id}
            style={[styles.row, { borderBottomColor: colors.line }]}
            onPress={() => {
              if (item.type === 'larp_check') router.push('/larp-check');
              else if (item.type === 'system' && String(item.data.kind ?? '').startsWith('feedback_')) router.push('/mentorship');
              else if (item.actorId) router.push({ pathname: '/user/[id]', params: { id: item.actorId } });
            }}
          >
            <Avatar name={item.actorName ?? '⚡'} color={item.actorColor ?? '#5B3DF5'} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { color: colors.ink }]}>{copy(item)}</Text>
              <Text style={[styles.time, { color: colors.muted }]}>{formatTime(item.at)}</Text>
            </View>
            {item.unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
          </Pressable>
        ))
      )}
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 28 },
  empty: { fontFamily: fonts.body, fontSize: 15, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 20 },
  time: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
