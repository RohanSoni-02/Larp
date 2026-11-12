import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';

import SphereImageGrid from '@/components/ui/img-sphere';
import { Art } from '@/src/components/Art';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Heatmap } from '@/src/components/Heatmap';
import { Icon, type AppIconName } from '@/src/components/Icon';
import { ProgressBar } from '@/src/components/ProgressBar';
import { Scrim } from '@/src/components/Scrim';
import { Seg } from '@/src/components/Seg';
import { Stamp } from '@/src/components/Stamp';
import { useSession } from '@/src/features/auth/SessionProvider';
import { inviteMessage } from '@/src/features/invite/api';
import { useSignedUrl } from '@/src/features/media/api';
import { useSetOpenToFeedback } from '@/src/features/mentorship/hooks';
import { useSetFollowing, useUserPosts } from '@/src/features/posts/hooks';
import { buildPortfolioSphereImages } from '@/src/features/skills/skillImages';
import { usePortfolio } from '@/src/features/trees/hooks';
import { levelFromXp } from '@/src/gamification/levels';
import { formatDuration } from '@/src/lib/format';
import { fonts, tierMetal, useTheme } from '@/src/theme';
import { tierName, type FeedPost, type Profile, type Skill, type UserSkill } from '@/src/types/app';

import { useFollowCounts, useGlowups, useMyProfile, useProfileStats, useVouchMutation, useVouches } from './hooks';

function PostTile({ post }: { post: FeedPost }) {
  const mediaKey = post.media[0]?.key ?? null;
  const url = useSignedUrl(mediaKey);
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id, kind: post.kind } })}
      accessibilityLabel={`${post.skillName} post, ${formatDuration(post.minutes * 60)}`}
    >
      {url ? (
        <Image source={{ uri: url }} style={styles.tileImage} />
      ) : (
        <Art
          seed={post.id}
          color={post.skillColor}
          letter={post.skillName}
          quality={Math.min(0.95, 0.3 + Object.values(post.kudoCounts).reduce((a, b) => a + b, 0) / 20)}
          aspectRatio={4 / 5}
        />
      )}
      {post.minutes > 0 ? <Scrim extent={0.4} opacity={0.45} /> : null}
      {post.kind === 'larp_check' ? (
        <View style={styles.tileBadge}>
          <Icon name="bolt" filled size={13} color="#FFFFFF" />
        </View>
      ) : null}
      {post.minutes > 0 ? (
        <View style={styles.tileCaption}>
          <Icon name="timer" size={11} color="#FFFFFF" />
          <Text style={styles.tileCaptionText}>{formatDuration(post.minutes * 60)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function LinkAction({ icon, label, onPress }: { icon: AppIconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" style={({ pressed }) => [styles.linkAction, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={15} color={colors.ink} />
      <Text style={[styles.linkActionText, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

function SkillLadder({
  userId,
  isMe,
  entry,
}: {
  userId: string;
  isMe: boolean;
  entry: UserSkill & { skills: Skill };
}) {
  const { colors } = useTheme();
  const { session } = useSession();
  const meId = session?.user?.id;
  const { data: vouches } = useVouches(userId);
  const { data: myPortfolio } = usePortfolio(meId);
  const vouch = useVouchMutation();
  const setOpen = useSetOpenToFeedback();
  const { data: owner } = useMyProfile(userId);
  const profileHandle = owner?.handle;
  const profileName = owner?.display_name;

  const skill = entry.skills;
  const tier = entry.tier;
  const vouchInfo = vouches?.find((v) => v.skillId === entry.skill_id);
  const myTier = myPortfolio?.find((p) => p.skill_id === entry.skill_id)?.tier ?? 0;
  const canVouch = !isMe && myTier > tier;

  // Progress toward next tier mirrors the DB rules: 5h/25h/100h + node counts.
  const nextAt = [5 * 60, 25 * 60, 100 * 60][tier] ?? null;
  const progress = nextAt ? Math.min(1, entry.total_minutes / nextAt) : 1;

  return (
    <Card>
      <View style={styles.ladderRow}>
        <Stamp tier={tierName(tier)} skillName={skill.name} size={76} />
        <View style={{ flex: 1 }}>
          <View style={styles.ladderTitleRow}>
            <Text style={[styles.skillName, { color: colors.ink }]} numberOfLines={1}>
              {skill.name}
            </Text>
            {!isMe && entry.open_to_feedback ? (
              <View style={[styles.mentorBadge, { backgroundColor: colors.fill }]}>
                <Icon name="mentor" size={12} color={colors.ink} />
                <Text style={[styles.mentorBadgeText, { color: colors.ink }]}>Mentor</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.skillSub, { color: colors.muted }]}>
            {formatDuration(entry.total_minutes * 60)} · {entry.nodes_landed} nodes landed
          </Text>
          <View style={styles.steps}>
            {[0, 1, 2, 3].map((t) => (
              <View key={t} style={[styles.step, { backgroundColor: t <= tier ? tierMetal[tier] : colors.surface3 }]} />
            ))}
          </View>
          {tier < 3 ? (
            <Text style={[styles.nextTier, { color: colors.muted }]}>
              <Text style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>
                {Math.max(0, Math.round((nextAt! - entry.total_minutes) / 60))}h
              </Text>{' '}
              to {tierName(tier + 1)}
            </Text>
          ) : (
            <Text style={[styles.nextTier, { color: colors.gold, fontFamily: fonts.bodyBold }]}>Top tier. Legit.</Text>
          )}
        </View>
      </View>
      {tier < 3 ? <ProgressBar progress={progress} gold height={4} /> : null}

      <View style={[styles.ladderLinks, { borderTopColor: colors.surface3 }]}>
        <LinkAction
          icon="podium"
          label="Leaderboard"
          onPress={() =>
            router.push({
              pathname: '/leaderboard',
              params: { skillId: entry.skill_id, title: skill.name, color: skill.color },
            })
          }
        />
        {isMe && profileHandle ? (
          <LinkAction
            icon="person-add"
            label="Invite a friend"
            onPress={() =>
              void Share.share({
                message: inviteMessage(profileName ?? 'A friend', profileHandle, { name: skill.name, slug: skill.slug }),
              })
            }
          />
        ) : null}
      </View>

      {isMe && tier >= 2 ? (
        <View style={[styles.mentorRow, { borderTopColor: colors.surface3 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.mentorTitle, { color: colors.ink }]}>Open to feedback</Text>
            <Text style={[styles.vouchHint, { color: colors.muted }]}>Lower tiers can ask you to review a session.</Text>
          </View>
          <Switch
            value={Boolean(entry.open_to_feedback)}
            disabled={setOpen.isPending}
            onValueChange={(open) =>
              setOpen.mutate(
                { skillId: entry.skill_id, open },
                { onError: (e) => Alert.alert('Could not update', e instanceof Error ? e.message : 'Try again.') },
              )
            }
            trackColor={{ true: colors.good, false: colors.surface3 }}
            accessibilityLabel={`Open to feedback in ${skill.name}`}
          />
        </View>
      ) : null}
      {!isMe && entry.open_to_feedback && myTier < tier && myPortfolio?.some((x) => x.skill_id === entry.skill_id) ? (
        <Button
          title="Ask for feedback"
          icon="mentor"
          variant="secondary"
          size="sm"
          onPress={() => router.push({ pathname: '/mentorship/ask', params: { skillId: entry.skill_id } })}
          style={{ alignSelf: 'flex-start', marginTop: 12 }}
        />
      ) : null}
      {!isMe ? (
        <View style={styles.vouchRow}>
          <Button
            title={vouchInfo?.includesMe ? 'Vouched' : `Vouch${vouchInfo ? ` · ${vouchInfo.count}` : ''}`}
            icon={vouchInfo?.includesMe ? 'check' : 'verified'}
            variant={vouchInfo?.includesMe ? 'secondary' : 'primary'}
            size="sm"
            disabled={!canVouch && !vouchInfo?.includesMe}
            loading={vouch.isPending}
            onPress={() =>
              vouch.mutate(
                { voucheeId: userId, skillId: entry.skill_id, undo: Boolean(vouchInfo?.includesMe) },
                {
                  onError: (e) => Alert.alert('Cannot vouch', e instanceof Error ? e.message : 'Try again later.'),
                },
              )
            }
          />
          {!canVouch && !vouchInfo?.includesMe ? (
            <Text style={[styles.vouchHint, { color: colors.muted }]}>Vouching needs a higher tier in {skill.name}.</Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.heroInk }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.heroMuted }]}>{label}</Text>
    </View>
  );
}

type ProfileViewProps = { userId: string; isMe: boolean };

/** Renders edge to edge: callers should use an unpadded Screen. */
export function ProfileView({ userId, isMe }: ProfileViewProps) {
  const { colors } = useTheme();
  const { data: profile } = useMyProfile(userId);
  const { data: counts } = useFollowCounts(userId);
  const { data: stats } = useProfileStats(userId);
  const { data: portfolio } = usePortfolio(userId);
  const { data: posts } = useUserPosts(userId);
  const { data: glowups } = useGlowups(userId);
  const setFollowing = useSetFollowing();
  const [tab, setTab] = useState<'posts' | 'glowups' | 'skills'>('posts');

  const level = useMemo(() => levelFromXp(profile?.xp_total ?? 0), [profile?.xp_total]);
  const sphereImages = useMemo(() => buildPortfolioSphereImages(portfolio ?? []), [portfolio]);

  if (!profile) return null;
  const p = profile as Profile;
  // Past ten hours the minutes are noise, and they no longer fit the column.
  const totalMinutes = stats?.totalMinutes ?? 0;
  const practised = totalMinutes >= 600 ? `${Math.round(totalMinutes / 60).toLocaleString()} h` : formatDuration(totalMinutes * 60);

  return (
    <View>
      {/* Player card */}
      <View style={styles.header}>
        <View style={styles.player}>
          <View style={styles.playerTop}>
            <Avatar name={p.display_name} color={p.avatar_color} size={84} />
            <View style={styles.identity}>
              <Text style={[styles.name, { color: colors.heroInk }]} numberOfLines={1}>
                {p.display_name}
              </Text>
              {p.class_title ? (
                <View style={styles.classRow}>
                  <Icon name="medal" size={13} color={colors.accentStrong} />
                  <Text style={[styles.classTitle, { color: colors.accentStrong }]}>{p.class_title}</Text>
                </View>
              ) : null}
              <View style={styles.levelRow} accessibilityLabel={`Larper level ${level.level}, ${level.current} of ${level.needed} XP`}>
                <View style={[styles.levelBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.levelBadgeText, { color: colors.accentInk }]}>LV {level.level}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ProgressBar progress={level.progress} height={6} color={colors.accent} trackColor={colors.surface3} />
                </View>
                <Text style={[styles.levelXp, { color: colors.heroMuted }]}>
                  {level.current}/{level.needed}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.stats, { borderColor: colors.line }]}>
            <Stat value={`${counts?.followers ?? 0}`} label="Followers" />
            <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
            <Stat value={`${counts?.following ?? 0}`} label="Following" />
            <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
            <Stat value={practised} label="Practised" />
          </View>
        </View>

        {p.bio ? <Text style={[styles.bio, { color: colors.ink }]}>{p.bio}</Text> : null}
        {(portfolio ?? []).length > 0 ? (
          <View style={styles.portfolio}>
            {(portfolio ?? []).slice(0, 3).map((entry) => (
              <View key={entry.skill_id} style={[styles.portfolioChip, { backgroundColor: colors.fill }]}>
                <View style={[styles.portfolioDot, { backgroundColor: entry.skills.color }]} />
                <Text style={[styles.portfolioText, { color: colors.ink }]}>
                  {entry.skills.name}
                  <Text style={{ color: colors.muted, fontFamily: fonts.body }}> · {tierName(entry.tier)}</Text>
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          {isMe ? (
            <>
              <Button title="Edit profile" icon="edit" variant="secondary" size="sm" style={styles.actionBtn} onPress={() => router.push('/profile/edit')} />
              <Button title="Share profile" icon="share-up" variant="secondary" size="sm" style={styles.actionBtn} onPress={() => router.push('/profile/share')} />
            </>
          ) : (
            <Button
              title={counts?.followedByMe ? 'Following' : 'Follow'}
              icon={counts?.followedByMe ? 'check' : 'person-add'}
              variant={counts?.followedByMe ? 'secondary' : 'accent'}
              size="sm"
              style={styles.actionBtn}
              loading={setFollowing.isPending}
              onPress={() => setFollowing.mutate({ userId, follow: !counts?.followedByMe })}
            />
          )}
        </View>
      </View>

      <Seg
        variant="tabs"
        options={[
          { value: 'posts', label: 'Posts', icon: 'grid' },
          { value: 'glowups', label: 'Glow-ups', icon: 'compare' },
          { value: 'skills', label: 'Skills', icon: 'medal' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'posts' ? (
        (posts ?? []).length > 0 ? (
          <View style={styles.grid}>
            {Array.from({ length: Math.ceil((posts ?? []).length / 3) }, (_, row) => {
              const slice = (posts ?? []).slice(row * 3, row * 3 + 3);
              return (
                <View key={row} style={styles.gridRow}>
                  {slice.map((post) => (
                    <PostTile key={`${post.kind}:${post.id}`} post={post} />
                  ))}
                  {Array.from({ length: 3 - slice.length }, (_, i) => (
                    <View key={`pad${i}`} style={styles.tileSpacer} />
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState icon="camera" title="No posts yet" body={isMe ? 'Log a session and it shows up here.' : undefined} />
        )
      ) : null}

      {tab === 'glowups' ? (
        <View style={styles.tabBody}>
          {(glowups ?? []).length > 0 ? (
            (glowups ?? []).map((g) => (
              <GlowupCard key={g.skillId} userId={userId} skillId={g.skillId} daySpan={g.daySpan} photoDays={g.photoDays} firstKey={g.firstKey} latestKey={g.latestKey} />
            ))
          ) : (
            <EmptyState
              icon="compare"
              title={isMe ? 'Your glow-ups live here' : 'No glow-ups yet'}
              body="Add a photo to your sessions and Larping lines up day 1 vs day 90 automatically."
            />
          )}
        </View>
      ) : null}

      {tab === 'skills' ? (
        <View style={styles.tabBody}>
          {(portfolio ?? []).length > 1 ? (
            <View style={[styles.sphereCard, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.cardTitle, { color: colors.ink, alignSelf: 'flex-start' }]}>
                Skill sphere
                <Text style={{ color: colors.muted, fontFamily: fonts.body }}> · {(portfolio ?? []).length} skills</Text>
              </Text>
              <SphereImageGrid
                images={sphereImages}
                containerSize={290}
                sphereRadius={114}
                dragSensitivity={0.75}
                baseImageScale={0.15}
                autoRotate
                autoRotateSpeed={0.22}
                showLabels
              />
            </View>
          ) : null}
          {(portfolio ?? []).map((entry) => (
            <SkillLadder key={entry.skill_id} userId={userId} isMe={isMe} entry={entry} />
          ))}
          {(portfolio ?? []).length === 0 ? <EmptyState compact icon="medal" title="No skills yet" /> : null}
          {stats ? (
            <Card>
              <View style={styles.heatHead}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>Last 14 weeks</Text>
                <Text style={[styles.heatMeta, { color: colors.muted }]}>{stats.sessionCount} sessions</Text>
              </View>
              <Heatmap minutesByDay={stats.minutesByDay} />
            </Card>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function GlowupCard({
  userId,
  skillId,
  daySpan,
  photoDays,
  firstKey,
  latestKey,
}: {
  userId: string;
  skillId: string;
  daySpan: number;
  photoDays: number;
  firstKey: string | null;
  latestKey: string | null;
}) {
  const { colors } = useTheme();
  const { data: portfolio } = usePortfolio(userId);
  const skill = portfolio?.find((x) => x.skill_id === skillId)?.skills;
  const firstUrl = useSignedUrl(firstKey);
  const latestUrl = useSignedUrl(latestKey);
  const color = skill?.color ?? colors.surface3;
  return (
    <Card>
      <View style={styles.heatHead}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>{skill?.name ?? 'Skill'} glow-up</Text>
        <Text style={[styles.heatMeta, { color: colors.muted }]}>
          {photoDays} photo days{daySpan > 0 ? ` · ${daySpan} days` : ''}
        </Text>
      </View>
      <View style={styles.glowupRow}>
        <View style={styles.glowupCol}>
          {firstUrl ? <Image source={{ uri: firstUrl }} style={styles.glowupImage} /> : <Art seed={`${skillId}-first`} color={color} letter={skill?.name ?? 'S'} quality={0.3} aspectRatio={1} style={styles.glowupArt} />}
          <View style={styles.glowupTag}>
            <Text style={styles.glowupTagText}>Day 1</Text>
          </View>
        </View>
        <View style={styles.glowupCol}>
          {latestUrl ? <Image source={{ uri: latestUrl }} style={styles.glowupImage} /> : <Art seed={`${skillId}-latest`} color={color} letter={skill?.name ?? 'S'} quality={0.8} aspectRatio={1} style={styles.glowupArt} />}
          <View style={styles.glowupTag}>
            <Text style={styles.glowupTagText}>Latest</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8 },
  player: {},
  playerTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stat: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36, marginRight: 14 },
  statValue: { fontFamily: fonts.numHeavy, fontSize: 32, lineHeight: 34, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  identity: { flex: 1, minWidth: 0, gap: 5 },
  name: { fontFamily: fonts.displayHeavy, fontSize: 28, lineHeight: 32, letterSpacing: -0.9 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  classTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  bio: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, marginTop: 14 },
  portfolio: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  portfolioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    height: 30,
  },
  portfolioDot: { width: 7, height: 7, borderRadius: 4 },
  portfolioText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  levelBadge: { borderRadius: 7, paddingHorizontal: 6, height: 22, justifyContent: 'center' },
  levelBadgeText: { fontFamily: fonts.numHeavy, fontSize: 14, letterSpacing: 0.2 },
  levelXp: { fontFamily: fonts.numMedium, fontSize: 14, fontVariant: ['tabular-nums'] },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 8 },
  actionBtn: { flex: 1, height: 40 },
  grid: { gap: 3, paddingTop: 3 },
  gridRow: { flexDirection: 'row', gap: 3 },
  tile: { flex: 1, aspectRatio: 4 / 5, overflow: 'hidden' },
  tileSpacer: { flex: 1 },
  tileImage: { width: '100%', height: '100%' },
  tileBadge: { position: 'absolute', top: 8, right: 8 },
  tileCaption: { position: 'absolute', left: 8, bottom: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tileCaptionText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 3,
  },
  tabBody: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  sphereCard: { borderRadius: 18, padding: 16, alignItems: 'center', overflow: 'hidden' },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.35 },
  heatHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  heatMeta: { fontFamily: fonts.body, fontSize: 13 },
  ladderRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  ladderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillName: { fontFamily: fonts.display, fontSize: 19, letterSpacing: -0.45, flexShrink: 1 },
  skillSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  steps: { flexDirection: 'row', gap: 4, marginTop: 10, marginBottom: 8 },
  step: { flex: 1, height: 4, borderRadius: 2 },
  nextTier: { fontFamily: fonts.body, fontSize: 13 },
  ladderLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  linkAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkActionText: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  vouchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  vouchHint: { fontFamily: fonts.body, fontSize: 12.5, flex: 1, minWidth: 120, lineHeight: 17 },
  mentorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, height: 22 },
  mentorBadgeText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },
  mentorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  mentorTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5 },
  glowupRow: { flexDirection: 'row', gap: 8 },
  glowupCol: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  glowupImage: { width: '100%', aspectRatio: 1 },
  glowupArt: { borderRadius: 12 },
  glowupTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  glowupTagText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 11.5 },
});
