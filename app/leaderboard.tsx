import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LeaderboardCard } from '@/components/ui/leaderboard-card';
import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { NavBar } from '@/src/components/Header';
import { Skeleton } from '@/src/components/Skeleton';
import { Seg } from '@/src/components/Seg';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useLeaderboard, useMyGuildIds, useSetGuildMember } from '@/src/features/leaderboard/hooks';
import { useNow } from '@/src/lib/useNow';
import { fonts, useTheme } from '@/src/theme';
import { tierName } from '@/src/types/app';

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ skillId?: string; guildId?: string; title?: string; color?: string }>();
  const { session } = useSession();
  const meId = session?.user?.id;
  const nowMs = useNow();
  const accent = params.color ?? colors.primary;
  const isGuild = Boolean(params.guildId);

  const [days, setDays] = useState<'7' | '30'>('7');
  const [who, setWho] = useState<'all' | 'following'>('all');
  const numDays = days === '7' ? 7 : 30;
  const { data: rows, isLoading } = useLeaderboard({
    skillId: params.skillId,
    guildId: params.guildId,
    followingOnly: !isGuild && who === 'following',
    days: numDays,
  });
  const { data: myGuilds } = useMyGuildIds();
  const setMember = useSetGuildMember();
  const inGuild = Boolean(params.guildId && myGuilds?.includes(params.guildId));

  const list = useMemo(() => rows ?? [], [rows]);

  const dateRange = useMemo(() => {
    const to = new Date(nowMs);
    const from = new Date(nowMs - numDays * 24 * 60 * 60 * 1000);
    return { from, to };
  }, [nowMs, numDays]);

  const podiumRankings = useMemo(
    () =>
      list.slice(0, 3).map((r, idx) => ({
        userId: r.userId,
        userName: r.name,
        rank: r.rank || idx + 1,
        value: r.minutes,
        avatarColor: r.color,
      })),
    [list],
  );

  const rankings = useMemo(
    () =>
      list.map((r, idx) => ({
        userId: r.userId,
        rank: r.rank || idx + 1,
        userName: r.name,
        byline: `${tierName(r.tier)} · ${r.sessions} sessions${r.nodesLanded > 0 ? ` · ${r.nodesLanded} landed` : ''}`,
        value: r.minutes,
        displayed: true,
        avatarColor: r.color,
      })),
    [list],
  );

  function openUser(userId: string) {
    if (userId === meId) router.push('/(tabs)/profile');
    else router.push({ pathname: '/user/[id]', params: { id: userId } });
  }

  return (
    <Screen scroll header={<NavBar onBack={() => router.back()} />}>
      <Text style={[styles.kicker, { color: accent }]}>{isGuild ? 'GUILD LEADERBOARD' : 'SKILL LEADERBOARD'}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{params.title ?? 'Leaderboard'}</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Ranked by minutes practised. Private sessions never count.
      </Text>

      {!isGuild ? (
        <View style={{ marginTop: 14 }}>
          <Seg
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'following', label: 'Following' },
            ]}
            value={who}
            onChange={setWho}
          />
        </View>
      ) : null}

      {isGuild ? (
        <Button
          title={inGuild ? 'Leave guild' : 'Join guild to rank'}
          variant={inGuild ? 'ghost' : 'primary'}
          size="sm"
          onPress={() => setMember.mutate({ guildId: params.guildId!, join: !inGuild })}
          loading={setMember.isPending}
          style={{ marginTop: 12, alignSelf: 'flex-start' }}
        />
      ) : null}

      {isLoading ? (
        <View style={{ gap: 10, marginTop: 20 }} accessibilityLabel="Loading leaderboard">
          <Skeleton height={220} radius={24} />
          <Skeleton height={56} radius={16} />
          <Skeleton height={56} radius={16} />
        </View>
      ) : list.length === 0 ? (
        <EmptyState icon="podium" title="No one on the board yet" body="Log a session and you’ll take first place." />
      ) : (
        <View style={{ marginTop: 16 }}>
          <LeaderboardCard
            title={params.title ?? 'Leaderboard'}
            fromDate={dateRange.from}
            toDate={dateRange.to}
            currentUserId={meId}
            runOptions={[
              { id: '7', label: 'This week' },
              { id: '30', label: '30 days' },
            ]}
            selectedRunId={days}
            onRunChange={(id) => setDays(id === '30' ? '30' : '7')}
            podiumRankings={podiumRankings}
            rankings={rankings}
            valueSuffix="min"
            onUserPress={openUser}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1, marginTop: 2 },
  sub: { fontFamily: fonts.body, fontSize: 14.5, marginTop: 8, lineHeight: 21 },
});
