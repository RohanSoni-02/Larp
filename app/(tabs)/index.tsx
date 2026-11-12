import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Art } from '@/src/components/Art';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { TopBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { IconButton } from '@/src/components/IconButton';
import { LiveDot } from '@/src/components/LiveDot';
import { PostCard } from '@/src/components/PostCard';
import { PressableScale } from '@/src/components/PressableScale';
import { Scrim } from '@/src/components/Scrim';
import { Screen } from '@/src/components/Screen';
import { Seg } from '@/src/components/Seg';
import { PostSkeleton } from '@/src/components/Skeleton';
import { Wordmark } from '@/src/components/Wordmark';
import { useUnreadCount } from '@/src/features/activity/hooks';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useMyCheck, useTodayWindow } from '@/src/features/larpcheck/hooks';
import { useFeed, useStoryPosts } from '@/src/features/posts/hooks';
import { useMyProfile, useMyStreak, useProfileStats } from '@/src/features/profile/hooks';
import { dayKey, formatClock, formatTime } from '@/src/lib/format';
import { useNow } from '@/src/lib/useNow';
import { levelFromXp } from '@/src/gamification/levels';
import { useUiStore } from '@/src/stores/ui';
import { fonts, GUTTER, useTheme } from '@/src/theme';
import type { FeedPost, StoryGroup } from '@/src/types/app';

/** Ticking countdown for the live Larp Check window (2 minutes from firedAt). */
function useSecondsLeft(firedAt: string | undefined): number {
  const now = useNow();
  if (!firedAt) return 0;
  return Math.max(0, Math.floor(120 - (now - new Date(firedAt).getTime()) / 1000));
}

function LarpBanner({ live, firedAt, secondsLeft }: { live: boolean; firedAt: string; secondsLeft: number }) {
  const { colors } = useTheme();
  const ink = colors.nightInk;
  return (
    <View style={[styles.banner, { backgroundColor: colors.night }]}>
      <View style={styles.bannerHead}>
        <View style={[styles.bannerIcon, { backgroundColor: colors.accent }]}>
          <Icon name="bolt" filled size={18} color={colors.accentInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: ink }]}>{live ? 'Larp Check is live' : 'Today’s Larp Check'}</Text>
          <Text style={[styles.bannerMeta, { color: colors.nightMuted }]}>
            {live ? 'Post before the timer runs out' : `Dropped at ${formatTime(firedAt)}`}
          </Text>
        </View>
        {live ? (
          <View style={[styles.bannerTimer, { borderColor: colors.nightLine }]}>
            <LiveDot size={7} />
            <Text style={[styles.bannerTimerText, { color: ink }]}>{formatClock(secondsLeft)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.bannerSub, { color: colors.nightMuted }]}>
        {live
          ? '2 minutes to show what you’re practising. No retakes, no pretending.'
          : 'Post yours to unblur everyone else’s — it’ll be marked late.'}
      </Text>
      <PressableScale
        onPress={() => router.push('/larp-check')}
        scale={0.975}
        pressedOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={live ? 'Post your Larp Check' : 'Post late'}
        style={[styles.bannerBtn, { backgroundColor: colors.accent }]}
      >
        <Icon name="camera" size={18} color={colors.accentInk} />
        <Text style={[styles.bannerBtnText, { color: colors.accentInk }]}>{live ? 'Post your Larp Check' : 'Post late'}</Text>
      </PressableScale>
    </View>
  );
}

function TodayTile({
  label,
  name,
  color,
  skillColor,
  seed,
  minutes,
  ring,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  name: string;
  color: string | undefined;
  skillColor: string;
  seed: string;
  minutes: number;
  ring: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale style={styles.story} scale={0.95} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <View style={[styles.tileRing, { borderColor: ring ? colors.accent : 'transparent' }]}>
        <View style={[styles.tile, { backgroundColor: colors.surface2 }]}>
          <Art seed={seed} color={skillColor} quality={0.7} aspectRatio={66 / 90} style={StyleSheet.absoluteFill} />
          <Scrim extent={0.55} opacity={0.5} />
          {minutes > 0 ? <Text style={styles.tileMinutes}>{minutes}m</Text> : null}
          <View style={styles.tileAvatar}>
            <Avatar name={name} color={color} size={28} />
          </View>
        </View>
      </View>
      <Text style={[styles.storyName, { color: ring ? colors.ink : colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

function StoriesRow({
  groups,
  meId,
  meName,
  meColor,
}: {
  groups: StoryGroup[];
  meId: string | undefined;
  meName: string;
  meColor: string | undefined;
}) {
  const { colors } = useTheme();
  const { storySeen } = useUiStore();
  const today = dayKey(new Date());
  const mine = groups.find((g) => g.userId === meId);
  const others = groups.filter((g) => g.userId !== meId);
  const minutesOf = (g: StoryGroup) => g.items.reduce((sum, p) => sum + p.minutes, 0);
  const latestColor = (g: StoryGroup) => g.items[g.items.length - 1]?.skillColor ?? colors.surface3;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories} contentContainerStyle={styles.storiesContent}>
      {mine ? (
        <TodayTile
          label="Your story"
          name={meName}
          color={meColor}
          skillColor={latestColor(mine)}
          seed={`today-${mine.userId}`}
          minutes={minutesOf(mine)}
          ring
          onPress={() => router.push({ pathname: '/story/[userId]', params: { userId: meId! } })}
          accessibilityLabel="Your story"
        />
      ) : (
        <PressableScale style={styles.story} scale={0.95} onPress={() => router.push('/session/new')} accessibilityRole="button" accessibilityLabel="Add today’s practice">
          <View style={[styles.tileRing, { borderColor: 'transparent' }]}>
            <View style={[styles.tile, styles.addTile, { borderColor: colors.subtle, backgroundColor: colors.surface }]}>
              <View style={[styles.addIcon, { backgroundColor: colors.accent }]}>
                <Icon name="plus" size={16} color={colors.accentInk} weight="bold" />
              </View>
            </View>
          </View>
          <Text style={[styles.storyName, { color: colors.ink }]} numberOfLines={1}>
            Add today
          </Text>
        </PressableScale>
      )}

      {others.map((g) => (
        <TodayTile
          key={g.userId}
          label={g.name.split(' ')[0] ?? g.name}
          name={g.name}
          color={g.color}
          skillColor={latestColor(g)}
          seed={`today-${g.userId}`}
          minutes={minutesOf(g)}
          ring={!storySeen[`${today}:${g.userId}`]}
          onPress={() => router.push({ pathname: '/story/[userId]', params: { userId: g.userId } })}
          accessibilityLabel={`${g.name}’s story`}
        />
      ))}
    </ScrollView>
  );
}

function StreakCard({ userId }: { userId: string }) {
  const { colors } = useTheme();
  const { data: streak } = useMyStreak();
  const { data: stats } = useProfileStats(userId);

  const days = useMemo(() => {
    const out: { letter: string; state: 'on' | 'shield' | 'off' }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const on = Boolean(stats?.minutesByDay[key]);
      const shield = !on && (streak?.shieldDaysUsed ?? []).includes(key);
      out.push({
        letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        state: on ? 'on' : shield ? 'shield' : 'off',
      });
    }
    return out;
  }, [stats, streak]);

  const practisedToday = Boolean(stats?.minutesByDay[dayKey(new Date())]);
  const count = streak?.current ?? 0;
  const shields = streak?.shields ?? 0;

  return (
    <View style={[styles.streak, { backgroundColor: colors.hero }]}>
      <View style={styles.streakTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.streakCountRow}>
            <Icon name="flame" filled size={24} color={count > 0 ? colors.flame : colors.heroMuted} />
            <Text style={[styles.streakNum, { color: colors.heroInk }]}>{count}</Text>
            <Text style={[styles.streakLabel, { color: colors.heroInk }]}>day streak</Text>
          </View>
          <Text style={[styles.streakMsg, { color: colors.heroMuted }]}>
            {count === 0
              ? 'Log a session today to start a streak.'
              : practisedToday
                ? 'You practised today. See you tomorrow.'
                : 'Practise today to keep it going.'}
          </Text>
        </View>
        <View
          style={[styles.shieldPill, { backgroundColor: colors.heroSurface }]}
          accessibilityLabel={`${shields} of 2 streak shields`}
        >
          {[0, 1].map((i) => (
            <Icon key={i} name="shield" filled={i < shields} size={14} color={i < shields ? colors.accentStrong : colors.heroMuted} />
          ))}
          <Text style={[styles.shieldText, { color: colors.heroInk }]}>{shields}/2</Text>
        </View>
      </View>
      <View style={styles.week}>
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          return (
            <View key={i} style={styles.weekDay}>
              <View
                style={[
                  styles.weekDot,
                  { backgroundColor: colors.heroSurface },
                  isToday && d.state === 'off' && { borderWidth: 1.5, borderColor: colors.heroInk },
                  d.state === 'on' && { backgroundColor: colors.accent },
                ]}
              >
                {d.state === 'on' ? <Icon name="check" size={14} color={colors.accentInk} weight="bold" /> : null}
                {d.state === 'shield' ? <Icon name="shield" filled size={13} color={colors.gold} /> : null}
              </View>
              <Text style={[styles.weekLetter, { color: isToday ? colors.heroInk : colors.heroMuted }]}>{d.letter}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const meId = session?.user?.id;
  const { data: profile } = useMyProfile(meId);
  const { data: unread } = useUnreadCount();
  const { data: window } = useTodayWindow();
  const { data: myCheck } = useMyCheck(window?.id);
  const liveLeft = useSecondsLeft(window?.firedAt);

  const feedTab = useUiStore((s) => s.feedTab);
  const setFeedTab = useUiStore((s) => s.setFeedTab);
  const { data: feed, isLoading: feedLoading } = useFeed();
  const { data: storyPosts } = useStoryPosts();

  const level = levelFromXp(profile?.xp_total ?? 0);
  const showBanner = Boolean(window && !myCheck);

  const storyGroups = useMemo<StoryGroup[]>(() => {
    const byUser = new Map<string, FeedPost[]>();
    for (const p of storyPosts ?? []) {
      const list = byUser.get(p.userId) ?? [];
      list.push(p);
      byUser.set(p.userId, list);
    }
    return [...byUser.entries()]
      .map(([userId, items]) => ({
        userId,
        name: items[0]!.authorName,
        color: items[0]!.authorColor,
        tier: items[0]!.authorTier,
        items,
      }))
      .sort((a, b) => (a.userId === meId ? -1 : b.userId === meId ? 1 : 0));
  }, [storyPosts, meId]);

  const posts = useMemo(() => {
    const all = feed?.posts ?? [];
    if (feedTab === 'following') {
      const ids = new Set([meId, ...(feed?.followingIds ?? [])]);
      return all.filter((p) => ids.has(p.userId));
    }
    return all;
  }, [feed, feedTab, meId]);

  return (
    <Screen
      scroll
      padded={false}
      edges={['top']}
      header={
        <TopBar
          left={<Wordmark />}
          right={
            <>
              {window && !myCheck && liveLeft > 0 ? (
                <Pressable
                  onPress={() => router.push('/larp-check')}
                  style={[styles.lcPill, { backgroundColor: colors.primary }]}
                  accessibilityLabel={`Larp Check, ${formatClock(liveLeft)} left`}
                >
                  <LiveDot size={7} />
                  <Text style={[styles.lcPillText, { color: colors.primaryInk }]}>{formatClock(liveLeft)}</Text>
                </Pressable>
              ) : null}
              <View style={[styles.levelPill, { backgroundColor: colors.surface2 }]} accessibilityLabel={`Level ${level.level}`}>
                <Text style={[styles.levelPillLabel, { color: colors.muted }]}>LV</Text>
                <Text style={[styles.levelPillText, { color: colors.ink }]}>{level.level}</Text>
              </View>
              <IconButton
                name="bell"
                onPress={() => router.push('/activity')}
                accessibilityLabel={`Activity${unread ? `, ${unread} new` : ''}`}
                badge={unread ?? 0}
              />
            </>
          }
        />
      }
    >
      <StoriesRow
        groups={storyGroups}
        meId={meId}
        meName={profile?.display_name ?? 'You'}
        meColor={profile?.avatar_color}
      />

      <View style={styles.section}>
        {showBanner ? <LarpBanner live={liveLeft > 0} firedAt={window!.firedAt} secondsLeft={liveLeft} /> : null}
        {meId ? <StreakCard userId={meId} /> : null}
      </View>

      <View style={styles.tabs}>
        <Seg
          variant="tabs"
          options={[
            { value: 'following', label: 'Following' },
            { value: 'foryou', label: 'For You' },
          ]}
          value={feedTab}
          onChange={setFeedTab}
        />
      </View>

      {feedLoading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="people"
          title={feedTab === 'following' ? 'Your feed is quiet' : 'Nothing here yet'}
          body={
            feedTab === 'following'
              ? 'Follow people learning your skills to fill this feed.'
              : 'New sessions from the community will show up here.'
          }
          action={
            feedTab === 'following' ? (
              <Button title="See For You" variant="secondary" size="sm" onPress={() => setFeedTab('foryou')} />
            ) : undefined
          }
        />
      ) : (
        posts.map((post) => <PostCard key={`${post.kind}:${post.id}`} post={post} meId={meId} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lcPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, height: 28, marginRight: 4 },
  lcPillText: { fontFamily: fonts.num, fontSize: 16, fontVariant: ['tabular-nums'] },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 28,
    marginRight: 2,
  },
  levelPillLabel: { fontFamily: fonts.numMedium, fontSize: 12, marginTop: 1 },
  levelPillText: { fontFamily: fonts.num, fontSize: 16 },
  stories: { flexGrow: 0 },
  storiesContent: { gap: 10, paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 6 },
  story: { width: 74, alignItems: 'center', gap: 6 },
  tileRing: { borderWidth: 2, borderRadius: 20, padding: 2 },
  tile: { width: 66, height: 90, borderRadius: 16, overflow: 'hidden' },
  addTile: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileMinutes: {
    position: 'absolute',
    top: 6,
    left: 7,
    color: '#FFFFFF',
    fontFamily: fonts.num,
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
  },
  tileAvatar: { position: 'absolute', left: 6, bottom: 6, borderRadius: 11, borderWidth: 1.5, borderColor: '#FFFFFF' },
  storyName: { fontFamily: fonts.bodyMedium, fontSize: 12, maxWidth: 74, letterSpacing: -0.05 },
  section: { paddingHorizontal: GUTTER, paddingTop: 12, gap: 10 },
  banner: { borderRadius: 24, padding: 18, gap: 14 },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: fonts.displayHeavy, fontSize: 20, lineHeight: 24, letterSpacing: -0.55 },
  bannerMeta: { fontFamily: fonts.bodyMedium, fontSize: 13, marginTop: 1 },
  bannerTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 30,
  },
  bannerTimerText: { fontFamily: fonts.num, fontSize: 17, fontVariant: ['tabular-nums'] },
  bannerSub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 999 },
  bannerBtnText: { fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.2 },
  streak: { borderRadius: 24, padding: 18 },
  streakTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  streakCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakNum: { fontFamily: fonts.numHeavy, fontSize: 44, lineHeight: 46, fontVariant: ['tabular-nums'] },
  streakLabel: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.35, marginTop: 6 },
  streakMsg: { fontFamily: fonts.body, fontSize: 13.5, marginTop: 2 },
  shieldPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 10, height: 30 },
  shieldText: { fontFamily: fonts.num, fontSize: 15, marginLeft: 3, fontVariant: ['tabular-nums'] },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  weekDay: { alignItems: 'center', gap: 6 },
  weekLetter: { fontFamily: fonts.bodyMedium, fontSize: 11.5 },
  weekDot: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabs: { marginTop: 16 },
});
