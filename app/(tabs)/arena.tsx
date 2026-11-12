import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { LeaderboardCard } from '@/components/ui/leaderboard-card';
import { LeaderboardRankings } from '@/components/ui/leaderboard-rankings';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { TopBar } from '@/src/components/Header';
import { Icon, type AppIconName } from '@/src/components/Icon';
import { LiveDot } from '@/src/components/LiveDot';
import { PressableScale } from '@/src/components/PressableScale';
import { ProgressBar } from '@/src/components/ProgressBar';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { Seg } from '@/src/components/Seg';
import { Sheet } from '@/src/components/Sheet';
import { TierPill } from '@/src/components/TierPill';
import { useSession } from '@/src/features/auth/SessionProvider';
import {
  useGuilds,
  useLeaderboard,
  useQuests,
  useRooms,
  useSetQuestJoined,
  useSetRsvp,
  useStandards,
} from '@/src/features/explore/hooks';
import { useMyGuildIds, useSetGuildMember } from '@/src/features/leaderboard/hooks';
import { useUsableSkills } from '@/src/features/skills/hooks';
import { useUiStore } from '@/src/stores/ui';
import { formatClock } from '@/src/lib/format';
import { useNow } from '@/src/lib/useNow';
import { fonts, useTheme } from '@/src/theme';
import { tierName, type CoopRoom, type GuildCard, type Quest, type Standard } from '@/src/types/app';

type ArenaView = 'overview' | 'quests' | 'rankings' | 'standards' | 'rooms' | 'guilds';

const VIEWS: { value: ArenaView; label: string }[] = [
  { value: 'overview', label: 'For you' },
  { value: 'quests', label: 'Quests' },
  { value: 'rankings', label: 'Rankings' },
  { value: 'standards', label: 'Standards' },
  { value: 'rooms', label: 'Rooms' },
  { value: 'guilds', label: 'Guilds' },
];

/* ─── Small building blocks ─── */

function ProgressRing({ pct, label, size = 44 }: { pct: number; label: string; size?: number }) {
  const { colors } = useTheme();
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.surface3} strokeWidth={stroke} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c}`}
            strokeDashoffset={c * (1 - Math.min(1, pct))}
          />
        </Svg>
      </View>
      <Text style={[styles.ringLabel, { color: colors.ink }]}>{label}</Text>
    </View>
  );
}

function SkillTag({ name, color }: { name: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.inline}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.meta, { color: colors.ink, fontFamily: fonts.bodyBold }]}>{name}</Text>
    </View>
  );
}

function AvatarStack({ people, size, ring }: { people: { id: string; name: string; color: string }[]; size: number; ring: string }) {
  return (
    <View style={styles.stack}>
      {people.slice(0, 5).map((m) => (
        <View key={m.id} style={[styles.stackItem, { borderColor: ring, borderRadius: size }]}>
          <Avatar name={m.name} color={m.color} size={size} />
        </View>
      ))}
    </View>
  );
}

function IconTile({ name }: { name: AppIconName }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.iconTile, { backgroundColor: colors.fill }]}>
      <Icon name={name} size={20} color={colors.ink} />
    </View>
  );
}

function DateBadge({ date }: { date: Date | null }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.dateBadge, { backgroundColor: colors.surface }]}>
      {date ? (
        <>
          <Text style={[styles.dateBadgeMonth, { color: colors.bad }]}>
            {date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
          </Text>
          <Text style={[styles.dateBadgeDay, { color: colors.ink }]}>{date.getDate()}</Text>
        </>
      ) : (
        <Icon name="people" size={20} color={colors.muted} />
      )}
    </View>
  );
}

function ViewIntro({ text, right }: { text: string; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.intro}>
      <Text style={[styles.introText, { color: colors.muted }]}>{text}</Text>
      {right}
    </View>
  );
}

/* ─── Live rooms ─── */

function RoomRailCard({ room, skillName }: { room: CoopRoom; skillName: string }) {
  const { colors } = useTheme();
  const { joinedRooms, joinRoom } = useUiStore();
  const joined = Boolean(joinedRooms[room.id]);
  const now = useNow();
  const elapsed = Math.max(0, (now - new Date(room.startedAt).getTime()) / 1000);
  const bg = colors.night;
  const count = room.members.length + (joined ? 1 : 0);
  return (
    <View style={[styles.railCard, { backgroundColor: bg }]}>
      <View style={styles.rowBetween}>
        <View style={styles.livePill}>
          <LiveDot size={6} />
          <Text style={styles.livePillText}>Live</Text>
        </View>
        <Text style={[styles.railTimer, { color: colors.nightMuted }]}>{formatClock(elapsed)}</Text>
      </View>
      <Text style={[styles.railTitle, { color: colors.nightInk }]} numberOfLines={1}>
        {room.title}
      </Text>
      <Text style={[styles.railSub, { color: colors.nightMuted }]} numberOfLines={1}>
        {count} practising {skillName.toLowerCase()} now
      </Text>
      <View style={[styles.rowBetween, { marginTop: 16 }]}>
        <AvatarStack people={room.members} size={26} ring={bg} />
        <PressableScale
          scale={0.94}
          onPress={() =>
            joined
              ? router.push({ pathname: '/session/new', params: { skillId: room.skillId, roomId: room.id, label: `Co-op: ${room.title}` } })
              : joinRoom(room.id)
          }
          accessibilityRole="button"
          accessibilityLabel={joined ? 'Log session' : 'Join quietly'}
          style={[styles.railBtn, { backgroundColor: joined ? colors.nightInk : colors.accent }]}
        >
          {joined ? <Icon name="play" size={12} color={colors.night} /> : null}
          <Text style={[styles.railBtnText, { color: joined ? colors.night : colors.accentInk }]}>{joined ? 'Log session' : 'Join quietly'}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function RoomCard({ room, skillName }: { room: CoopRoom; skillName: string }) {
  const { colors } = useTheme();
  const { joinedRooms, joinRoom } = useUiStore();
  const joined = Boolean(joinedRooms[room.id]);
  const now = useNow();
  const elapsed = Math.max(0, (now - new Date(room.startedAt).getTime()) / 1000);
  const count = room.members.length + (joined ? 1 : 0);
  const people = joined ? [...room.members, { id: 'me', name: 'You', color: colors.ink }] : room.members;

  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.inline}>
          <LiveDot size={7} />
          <Text style={[styles.meta, { color: colors.muted }]}>Live · {skillName}</Text>
        </View>
        <Text style={[styles.roomTimer, { color: colors.muted }]}>{formatClock(elapsed)}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.ink }]}>{room.title}</Text>
      <Text style={[styles.cardDesc, { color: colors.muted }]}>
        {count} {count === 1 ? 'person' : 'people'} practising {skillName.toLowerCase()} now. Cameras face the work, mics off.
      </Text>
      <View style={[styles.rowBetween, { marginTop: 14 }]}>
        {people.length > 0 ? <AvatarStack people={people} size={28} ring={colors.surface2} /> : <View />}
        {joined ? (
          <Button
            title="Log a session here"
            icon="play"
            size="sm"
            onPress={() =>
              router.push({ pathname: '/session/new', params: { skillId: room.skillId, roomId: room.id, label: `Co-op: ${room.title}` } })
            }
          />
        ) : (
          <Button title="Join quietly" variant="secondary" size="sm" onPress={() => joinRoom(room.id)} />
        )}
      </View>
    </Card>
  );
}

/* ─── Quests ─── */

function QuestCard({ quest, skillColor, skillName }: { quest: Quest; skillColor: string; skillName: string }) {
  const { colors } = useTheme();
  const join = useSetQuestJoined();
  const done = Math.min(quest.progressDays, quest.goalDays);
  return (
    <Card>
      <View style={styles.rowBetween}>
        <SkillTag name={quest.skillId ? skillName : 'Any skill'} color={quest.skillId ? skillColor : colors.subtle} />
        <Text style={[styles.meta, { color: colors.muted }]}>Ends Sunday</Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.ink }]}>{quest.title}</Text>
      <Text style={[styles.cardDesc, { color: colors.muted }]}>{quest.description}</Text>
      {quest.joined ? (
        <View style={styles.questProgress}>
          <View style={styles.rowBetween}>
            <Text style={[styles.small, { color: colors.ink }]}>
              <Text style={{ fontFamily: fonts.bodyBold }}>
                {done} of {quest.goalDays}
              </Text>{' '}
              days done
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{Math.round((done / quest.goalDays) * 100)}%</Text>
          </View>
          <ProgressBar progress={quest.progressDays / quest.goalDays} />
        </View>
      ) : null}
      <View style={[styles.rowBetween, { marginTop: 14 }]}>
        <View style={styles.inline}>
          <Icon name="people" size={15} color={colors.muted} />
          <Text style={[styles.meta, { color: colors.muted }]}>{quest.people.toLocaleString()} people in</Text>
        </View>
        <Button
          title={quest.joined ? 'Joined' : 'Join quest'}
          icon={quest.joined ? 'check' : undefined}
          variant={quest.joined ? 'secondary' : 'accent'}
          size="sm"
          onPress={() => join.mutate({ questId: quest.id, join: !quest.joined })}
        />
      </View>
    </Card>
  );
}

function QuestRow({ quest, skillName }: { quest: Quest; skillName: string }) {
  const { colors } = useTheme();
  const join = useSetQuestJoined();
  const done = Math.min(quest.progressDays, quest.goalDays);
  return (
    <View style={styles.listRow}>
      {quest.joined ? <ProgressRing pct={quest.progressDays / quest.goalDays} label={`${done}/${quest.goalDays}`} /> : <IconTile name="flag" />}
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.ink }]} numberOfLines={1}>
          {quest.title}
        </Text>
        <Text style={[styles.rowSub, { color: colors.muted }]} numberOfLines={1}>
          {quest.skillId ? skillName : 'Any skill'} · {quest.joined ? `${done} of ${quest.goalDays} days` : `${quest.people.toLocaleString()} in`}
        </Text>
      </View>
      {quest.joined ? (
        <View style={[styles.statusPill, { backgroundColor: colors.fill }]}>
          <Text style={[styles.statusPillText, { color: colors.ink }]}>Joined</Text>
        </View>
      ) : (
        <Button title="Join" size="sm" variant="secondary" onPress={() => join.mutate({ questId: quest.id, join: true })} />
      )}
    </View>
  );
}

/* ─── Standards ─── */

function StandardCard({ standard, skillName, skillColor }: { standard: Standard; skillName: string; skillColor: string }) {
  const { colors } = useTheme();
  return (
    <Card>
      <SkillTag name={skillName} color={skillColor} />
      <Text style={[styles.cardTitle, { color: colors.ink }]}>{standard.title}</Text>
      <Text style={[styles.cardDesc, { color: colors.muted }]}>{standard.description}</Text>
      {standard.attempts.length > 0 ? (
        <View style={[styles.attempts, { borderTopColor: colors.line }]}>
          {standard.attempts.map((a) => (
            <Pressable
              key={a.userId}
              style={styles.attempt}
              onPress={() => router.push({ pathname: '/user/[id]', params: { id: a.userId } })}
              accessibilityRole="button"
              accessibilityLabel={`${a.name}, ${a.result}`}
            >
              <Avatar name={a.name} color={a.color} size={32} />
              <View style={[styles.flex, { gap: 3 }]}>
                <Text style={[styles.small, { color: colors.ink, fontFamily: fonts.bodyBold }]}>{a.name}</Text>
                <TierPill tier={tierName(a.tier)} showDayOne={false} />
              </View>
              <Text style={[styles.small, { color: colors.ink, fontFamily: fonts.bodyBold }]}>{a.result}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Button
        title="Attempt this standard"
        icon="video"
        variant="secondary"
        style={{ marginTop: 14 }}
        onPress={() =>
          router.push({
            pathname: '/session/new',
            params: { skillId: standard.skillId, label: `Standard: ${standard.title}` },
          })
        }
      />
    </Card>
  );
}

function StandardRow({ standard, skillName, onOpen }: { standard: Standard; skillName: string; onOpen: () => void }) {
  const { colors } = useTheme();
  const best = standard.attempts[0];
  return (
    <PressableScale scale={0.98} pressedOpacity={0.6} style={styles.listRow} onPress={onOpen} accessibilityRole="button">
      <IconTile name="medal" />
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.ink }]} numberOfLines={1}>
          {standard.title}
        </Text>
        <Text style={[styles.rowSub, { color: colors.muted }]} numberOfLines={1}>
          {skillName}
          {best ? ` · ${best.result} by ${best.name}` : ' · Be the first'}
        </Text>
      </View>
      <Icon name="chevron-right" size={14} color={colors.subtle} weight="semibold" />
    </PressableScale>
  );
}

/* ─── Guilds ─── */

function GuildCardRow({ guild }: { guild: GuildCard }) {
  const { colors } = useTheme();
  const rsvp = useSetRsvp();
  const { data: myGuilds } = useMyGuildIds();
  const setMember = useSetGuildMember();
  const member = Boolean(myGuilds?.includes(guild.id));
  const date = guild.startsAt ? new Date(guild.startsAt) : null;
  return (
    <Card>
      <View style={styles.guildHead}>
        <DateBadge date={date} />
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.ink, marginTop: 0 }]}>{guild.name}</Text>
          <Text style={[styles.meta, { color: colors.muted, marginTop: 3 }]}>
            {date
              ? `${date.toLocaleDateString(undefined, { weekday: 'long' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
              : 'Next meetup TBD'}
          </Text>
          {guild.place ? (
            <View style={[styles.inline, { marginTop: 3 }]}>
              <Icon name="location" size={13} color={colors.muted} />
              <Text style={[styles.meta, { color: colors.muted, flexShrink: 1 }]} numberOfLines={1}>
                {guild.place}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.rowBetween, { marginTop: 14 }]}>
        <Text style={[styles.small, { color: colors.ink }]}>
          <Text style={{ fontFamily: fonts.bodyBold }}>{guild.goingCount}</Text> going
        </Text>
        {guild.eventId ? (
          <Button
            title={guild.imGoing ? 'Going' : 'I’m going'}
            icon={guild.imGoing ? 'check' : undefined}
            variant={guild.imGoing ? 'secondary' : 'accent'}
            size="sm"
            onPress={() => rsvp.mutate({ eventId: guild.eventId!, going: !guild.imGoing })}
          />
        ) : null}
      </View>
      <View style={[styles.guildLinks, { borderTopColor: colors.line }]}>
        <Pressable
          onPress={() => setMember.mutate({ guildId: guild.id, join: !member })}
          hitSlop={6}
          style={styles.inline}
          accessibilityRole="button"
          accessibilityLabel={member ? `Leave ${guild.name}` : `Join ${guild.name}`}
        >
          <Icon name={member ? 'check-circle' : 'person-add'} filled={member} size={16} color={member ? colors.muted : colors.ink} />
          <Text style={[styles.guildLink, { color: member ? colors.muted : colors.ink }]}>{member ? 'Member · Leave' : 'Join guild'}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/leaderboard', params: { guildId: guild.id, title: guild.name, color: colors.good } })}
          hitSlop={6}
          style={styles.inline}
          accessibilityRole="button"
        >
          <Icon name="podium" size={16} color={colors.ink} />
          <Text style={[styles.guildLink, { color: colors.ink }]}>Leaderboard</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function MeetupRow({ guild }: { guild: GuildCard }) {
  const { colors } = useTheme();
  const rsvp = useSetRsvp();
  const date = guild.startsAt ? new Date(guild.startsAt) : null;
  return (
    <View style={styles.listRow}>
      <DateBadge date={date} />
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.ink }]} numberOfLines={1}>
          {guild.name}
        </Text>
        <Text style={[styles.rowSub, { color: colors.muted }]} numberOfLines={1}>
          {date ? date.toLocaleTimeString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'TBD'}
          {guild.place ? ` · ${guild.place}` : ''}
        </Text>
      </View>
      {guild.eventId ? (
        <Button
          title={guild.imGoing ? 'Going' : 'Join'}
          icon={guild.imGoing ? 'check' : undefined}
          variant="secondary"
          size="sm"
          onPress={() => rsvp.mutate({ eventId: guild.eventId!, going: !guild.imGoing })}
        />
      ) : null}
    </View>
  );
}

/* ─── Skill filter ─── */

function FilterOption({ label, color, selected, onPress }: { label: string; color?: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.filterRow, { borderBottomColor: colors.line }, pressed && { opacity: 0.6 }]}
    >
      {color ? <View style={[styles.dot, { backgroundColor: color, width: 10, height: 10, borderRadius: 5 }]} /> : <Icon name="layers" size={16} color={colors.muted} />}
      <Text style={[styles.filterLabel, { color: colors.ink, fontFamily: selected ? fonts.bodyBold : fonts.body }]}>{label}</Text>
      {selected ? <Icon name="check" size={16} color={colors.ink} weight="bold" /> : null}
    </Pressable>
  );
}

/* ─── Screen ─── */

export default function ArenaScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const meId = session?.user?.id;
  const nowMs = useNow();
  const [view, setView] = useState<ArenaView>('overview');
  const [filterOpen, setFilterOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [leaderboardRunId, setLeaderboardRunId] = useState<string>('7');
  const [followingOnly, setFollowingOnly] = useState<boolean>(false);

  const leaderboardDays = Number(leaderboardRunId) || 7;
  const { data: skills } = useUsableSkills();
  const { data: quests } = useQuests();
  const { data: standards } = useStandards();
  const { data: rooms } = useRooms();
  const { data: guilds } = useGuilds();
  const { data: leaderboard = [] } = useLeaderboard({ skillId: skillFilter, followingOnly, days: leaderboardDays });

  const skillName = (id: string | null) => skills?.find((s) => s.id === id)?.name ?? 'Skill';
  const skillColor = (id: string | null) => skills?.find((s) => s.id === id)?.color ?? colors.subtle;

  const leaderboardDates = useMemo(() => {
    const to = new Date(nowMs);
    const from = new Date(nowMs - leaderboardDays * 24 * 60 * 60 * 1000);
    return { from, to };
  }, [nowMs, leaderboardDays]);

  const podiumRankings = useMemo(
    () =>
      leaderboard.slice(0, 3).map((entry, idx) => ({
        userId: entry.userId,
        userName: entry.displayName,
        rank: entry.rank || idx + 1,
        value: entry.minutes,
        avatarColor: entry.avatarColor,
      })),
    [leaderboard],
  );

  const rankingItems = useMemo(
    () =>
      leaderboard.map((entry, idx) => ({
        userId: entry.userId,
        rank: entry.rank || idx + 1,
        userName: entry.displayName,
        byline: `${tierName(entry.tier)} · ${entry.sessions} ${entry.sessions === 1 ? 'session' : 'sessions'}${entry.nodesLanded > 0 ? ` · ${entry.nodesLanded} ${entry.nodesLanded === 1 ? 'node' : 'nodes'} landed` : ''}`,
        value: entry.minutes,
        displayed: true,
        avatarColor: entry.avatarColor,
      })),
    [leaderboard],
  );

  const visibleQuests = (quests ?? []).filter((q) => !skillFilter || !q.skillId || q.skillId === skillFilter);
  const visibleStandards = (standards ?? []).filter((s) => !skillFilter || s.skillId === skillFilter);
  const visibleRooms = (rooms ?? []).filter((r) => !skillFilter || r.skillId === skillFilter);
  const visibleGuilds = (guilds ?? []).filter((g) => !skillFilter || g.skillId === skillFilter);

  const me = leaderboard.find((e) => e.userId === meId);
  // Who is directly ahead, and by how much: a rank is more useful with a target attached.
  const ahead = me ? leaderboard.filter((e) => e.minutes > me.minutes).sort((a, b) => a.minutes - b.minutes)[0] : undefined;
  const chase = me && ahead ? { gap: ahead.minutes - me.minutes + 1, name: ahead.displayName.split(' ')[0] ?? ahead.displayName } : null;
  const periodLabel = leaderboardDays === 7 ? 'This week' : `Last ${leaderboardDays} days`;
  const featuredQuests = [...visibleQuests].sort((a, b) => Number(b.joined) - Number(a.joined)).slice(0, 3);
  const upcoming = visibleGuilds
    .filter((g) => g.startsAt)
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())
    .slice(0, 2);
  const overviewEmpty =
    visibleRooms.length === 0 && visibleQuests.length === 0 && visibleGuilds.length === 0 && visibleStandards.length === 0 && leaderboard.length === 0;

  const openUser = (uid: string) => router.push({ pathname: '/user/[id]', params: { id: uid } });

  const filterButton = (
    <PressableScale
      scale={0.95}
      pressedOpacity={0.8}
      onPress={() => setFilterOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={`Filter by skill, ${skillFilter ? skillName(skillFilter) : 'all skills'}`}
      style={[styles.filterPill, { backgroundColor: skillFilter ? colors.ink : colors.fill }]}
    >
      {skillFilter ? <View style={[styles.dot, { backgroundColor: skillColor(skillFilter) }]} /> : null}
      <Text style={[styles.filterPillText, { color: skillFilter ? colors.bg : colors.ink }]} numberOfLines={1}>
        {skillFilter ? skillName(skillFilter) : 'All skills'}
      </Text>
      <Icon name="chevron-down" size={12} color={skillFilter ? colors.bg : colors.ink} weight="semibold" />
    </PressableScale>
  );

  const followToggle = (
    <Seg
      options={[
        { value: 'everyone', label: 'Everyone' },
        { value: 'following', label: 'Following' },
      ]}
      value={followingOnly ? 'following' : 'everyone'}
      onChange={(v) => setFollowingOnly(v === 'following')}
    />
  );

  return (
    <Screen
      padded={false}
      edges={['top']}
      header={
        <>
          <TopBar title="Arena" right={<View style={{ marginRight: 8 }}>{filterButton}</View>} />
          <Seg variant="tabs" scrollable options={VIEWS} value={view} onChange={setView} />
        </>
      }
    >
      <ScrollView key={view} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {view === 'overview' ? (
          overviewEmpty ? (
            <EmptyState icon="arena" title="Nothing here yet" body="Quests, rooms and meetups for this skill will show up here." />
          ) : (
            <>
              {me ? (
                <PressableScale
                  scale={0.985}
                  onPress={() => setView('rankings')}
                  accessibilityRole="button"
                  accessibilityLabel={`Your rank ${me.rank}, ${me.minutes} minutes${chase ? `. ${chase.gap} minutes behind ${chase.name}` : ''}`}
                  style={[styles.weekCard, { backgroundColor: colors.night }]}
                >
                 <View style={styles.weekTop}>
                  <View style={styles.weekRankCol}>
                    <Text style={[styles.weekLabel, { color: colors.nightMuted }]}>{periodLabel}</Text>
                    <View style={styles.weekRankRow}>
                      <Text style={[styles.weekRankHash, { color: colors.nightMuted }]}>#</Text>
                      <Text style={[styles.weekRank, { color: colors.nightInk }]}>{me.rank}</Text>
                    </View>
                  </View>
                  <View style={[styles.weekSide, { borderLeftColor: colors.nightLine }]}>
                    {[
                      { label: 'Minutes', value: me.minutes.toLocaleString() },
                      { label: 'Sessions', value: `${me.sessions}` },
                    ].map((s) => (
                      <View key={s.label}>
                        <Text style={[styles.weekValue, { color: colors.nightInk }]}>{s.value}</Text>
                        <Text style={[styles.weekStatLabel, { color: colors.nightMuted }]}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Icon name="chevron-right" size={14} color={colors.nightMuted} weight="semibold" />
                 </View>
                  <View style={[styles.weekChase, { backgroundColor: colors.nightLine }]}>
                    <Icon name={chase ? 'trending' : 'medal'} size={15} color={colors.nightInk} />
                    <Text style={[styles.weekChaseText, { color: colors.nightInk }]} numberOfLines={1}>
                      {chase ? (
                        <>
                          <Text style={{ fontFamily: fonts.bodyBold }}>{chase.gap} min</Text> to pass {chase.name}
                        </>
                      ) : (
                        'You’re leading. Keep it that way.'
                      )}
                    </Text>
                  </View>
                </PressableScale>
              ) : null}

              {visibleRooms.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader title="Live now" actionLabel="See all" onAction={() => setView('rooms')} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={282}
                    decelerationRate="fast"
                    style={styles.rail}
                    contentContainerStyle={styles.railContent}
                  >
                    {visibleRooms.map((r) => (
                      <RoomRailCard key={r.id} room={r} skillName={skillName(r.skillId)} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {featuredQuests.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader title="Side quests" actionLabel="See all" onAction={() => setView('quests')} />
                  <View style={[styles.group, { backgroundColor: colors.surface2 }]}>
                    {featuredQuests.map((q) => (
                      <QuestRow key={q.id} quest={q} skillName={skillName(q.skillId)} />
                    ))}
                  </View>
                </View>
              ) : null}

              {rankingItems.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader title={`Top ${periodLabel.toLowerCase()}`} actionLabel="See all" onAction={() => setView('rankings')} />
                  <View style={[styles.group, { backgroundColor: colors.surface2 }]}>
                    <LeaderboardRankings rankings={rankingItems} currentUserId={meId} limit={3} valueSuffix="min" onUserPress={openUser} />
                  </View>
                </View>
              ) : null}

              {upcoming.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader title="Upcoming meetups" actionLabel="See all" onAction={() => setView('guilds')} />
                  <View style={[styles.group, { backgroundColor: colors.surface2 }]}>
                    {upcoming.map((g) => (
                      <MeetupRow key={g.id} guild={g} />
                    ))}
                  </View>
                </View>
              ) : null}

              {visibleStandards.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader title="Standards to try" actionLabel="See all" onAction={() => setView('standards')} />
                  <View style={[styles.group, { backgroundColor: colors.surface2 }]}>
                    {visibleStandards.slice(0, 3).map((s) => (
                      <StandardRow key={s.id} standard={s} skillName={skillName(s.skillId)} onOpen={() => setView('standards')} />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )
        ) : null}

        {view === 'quests' ? (
          <>
            <ViewIntro text="Weekly challenges, done your way." />
            {visibleQuests.length > 0 ? (
              <View style={styles.list}>
                {visibleQuests.map((q) => (
                  <QuestCard key={q.id} quest={q} skillColor={skillColor(q.skillId)} skillName={skillName(q.skillId)} />
                ))}
              </View>
            ) : (
              <EmptyState compact icon="flag" title="No quests this week" body="Check back on Monday for new challenges." />
            )}
          </>
        ) : null}

        {view === 'rankings' ? (
          <>
            <View style={styles.rankingsTop}>{followToggle}</View>
            <LeaderboardCard
              title={skillFilter ? `${skillName(skillFilter)} leaderboard` : 'Leaderboard'}
              fromDate={leaderboardDates.from}
              toDate={leaderboardDates.to}
              currentUserId={meId ?? '10000000-0000-4000-8000-000000000001'}
              runOptions={[
                { id: '7', label: '7d' },
                { id: '30', label: '30d' },
                { id: '90', label: '90d' },
              ]}
              selectedRunId={leaderboardRunId}
              onRunChange={setLeaderboardRunId}
              podiumRankings={podiumRankings}
              rankings={rankingItems}
              valueSuffix="min"
              onUserPress={openUser}
            />
            <Text style={[styles.footnote, { color: colors.subtle }]}>Ranked by verified practice minutes.</Text>
          </>
        ) : null}

        {view === 'standards' ? (
          <>
            <ViewIntro text="Fixed bars to measure yourself against." />
            {visibleStandards.length > 0 ? (
              <View style={styles.list}>
                {visibleStandards.map((s) => (
                  <StandardCard key={s.id} standard={s} skillName={skillName(s.skillId)} skillColor={skillColor(s.skillId)} />
                ))}
              </View>
            ) : (
              <EmptyState compact icon="medal" title="No standards yet" body="Standards for this skill are on the way." />
            )}
          </>
        ) : null}

        {view === 'rooms' ? (
          <>
            <ViewIntro text="Quiet body-doubling. Cameras on the work, mics off." />
            {visibleRooms.length > 0 ? (
              <View style={styles.list}>
                {visibleRooms.map((r) => (
                  <RoomCard key={r.id} room={r} skillName={skillName(r.skillId)} />
                ))}
              </View>
            ) : (
              <EmptyState compact icon="video" title="No rooms open" body="Rooms appear here while people are practising live." />
            )}
          </>
        ) : null}

        {view === 'guilds' ? (
          <>
            <ViewIntro text="Meet up and practise together." />
            {visibleGuilds.length > 0 ? (
              <View style={styles.list}>
                {visibleGuilds.map((g) => (
                  <GuildCardRow key={g.id} guild={g} />
                ))}
              </View>
            ) : (
              <EmptyState compact icon="location" title="No guilds nearby" body="There are no guilds for this skill near you yet." />
            )}
          </>
        ) : null}
      </ScrollView>

      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter by skill">
        <ScrollView style={{ maxHeight: 420 }}>
          <FilterOption
            label="All skills"
            selected={skillFilter === null}
            onPress={() => {
              setSkillFilter(null);
              setFilterOpen(false);
            }}
          />
          {(skills ?? []).map((s) => (
            <FilterOption
              key={s.id}
              label={s.name}
              color={s.color}
              selected={skillFilter === s.id}
              onPress={() => {
                setSkillFilter(s.id);
                setFilterOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  flex: { flex: 1, minWidth: 0 },
  section: { marginTop: 30, gap: 12 },
  group: { borderRadius: 22, paddingHorizontal: 14, paddingVertical: 6 },
  list: { gap: 12 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  introText: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20 },
  rankingsTop: { marginBottom: 20 },
  footnote: { fontFamily: fonts.body, fontSize: 12.5, textAlign: 'center', marginTop: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { fontFamily: fonts.body, fontSize: 13 },
  small: { fontFamily: fonts.body, fontSize: 14 },
  cardTitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24, letterSpacing: -0.45, marginTop: 10 },
  cardDesc: { fontFamily: fonts.body, fontSize: 14, marginTop: 4, lineHeight: 20 },
  ringLabel: { fontFamily: fonts.num, fontSize: 14, fontVariant: ['tabular-nums'] },
  stack: { flexDirection: 'row', paddingLeft: 6 },
  stackItem: { marginLeft: -6, borderWidth: 2 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: -0.2 },
  rowSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 11, height: 28, justifyContent: 'center' },
  statusPillText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  questProgress: { marginTop: 14, gap: 8 },
  attempts: { marginTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  attempt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12 },
  roomTimer: { fontFamily: fonts.num, fontSize: 16, fontVariant: ['tabular-nums'] },
  guildHead: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dateBadge: { width: 48, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateBadgeMonth: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.4 },
  dateBadgeDay: { fontFamily: fonts.numHeavy, fontSize: 24, lineHeight: 26 },
  guildLinks: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  guildLink: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  weekCard: { borderRadius: 26, padding: 8, gap: 4 },
  weekTop: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 10, paddingLeft: 12, paddingRight: 8 },
  weekChase: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingHorizontal: 14, height: 42 },
  weekChaseText: { flex: 1, fontFamily: fonts.body, fontSize: 14, letterSpacing: -0.1 },
  weekRankCol: { minWidth: 96 },
  weekLabel: { fontFamily: fonts.bodyBold, fontSize: 13 },
  weekRankRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 },
  weekRankHash: { fontFamily: fonts.numHeavy, fontSize: 30, lineHeight: 44, marginRight: 2 },
  weekRank: { fontFamily: fonts.numHeavy, fontSize: 68, lineHeight: 70, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  weekSide: { flex: 1, gap: 10, borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: 18 },
  weekValue: { fontFamily: fonts.numHeavy, fontSize: 28, lineHeight: 30, fontVariant: ['tabular-nums'] },
  weekStatLabel: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 },
  rail: { marginHorizontal: -16 },
  railContent: { gap: 10, paddingHorizontal: 16 },
  railCard: { width: 272, borderRadius: 24, padding: 18, gap: 4 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 22,
  },
  livePillText: { color: '#E5484D', fontFamily: fonts.bodyBold, fontSize: 11.5 },
  railTimer: { fontFamily: fonts.num, fontSize: 16, fontVariant: ['tabular-nums'] },
  railTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 25, letterSpacing: -0.5, marginTop: 12 },
  railSub: { fontFamily: fonts.body, fontSize: 13 },
  railBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, height: 36 },
  railBtnText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
    maxWidth: 170,
  },
  filterPillText: { fontFamily: fonts.bodyBold, fontSize: 13, flexShrink: 1 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderBottomWidth: StyleSheet.hairlineWidth },
  filterLabel: { flex: 1, fontSize: 15.5, letterSpacing: -0.2 },
});
