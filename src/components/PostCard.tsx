import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Art } from '@/src/components/Art';
import { Avatar } from '@/src/components/Avatar';
import { Icon } from '@/src/components/Icon';
import { IconButton } from '@/src/components/IconButton';
import { PressableScale } from '@/src/components/PressableScale';
import { TierPill } from '@/src/components/TierPill';
import { VideoProof } from '@/src/components/VideoProof';
import { useSignedUrl } from '@/src/features/media/api';
import { useToggleKudo, useToggleSave } from '@/src/features/posts/hooks';
import { formatDuration, formatRelativeTime } from '@/src/lib/format';
import { fonts, useTheme } from '@/src/theme';
import { kudoLabelsFor, tierName, type FeedPost } from '@/src/types/app';

const DOUBLE_TAP_MS = 320;

function PostMedia({ post, blurred }: { post: FeedPost; blurred: boolean }) {
  const { colors } = useTheme();
  const signed = useSignedUrl(post.media[0]?.key ?? null);
  const toggleKudo = useToggleKudo();
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(false);
  const [burstAnim] = useState(() => new Animated.Value(0));

  const fireBurst = () => {
    setBurst(true);
    burstAnim.setValue(0);
    Animated.timing(burstAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start(() =>
      setBurst(false),
    );
  };

  const onTap = () => {
    if (blurred) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (!post.myKudos.includes('Clean technique')) {
        toggleKudo.mutate({ post, label: 'Clean technique', on: false });
      }
      fireBurst();
    } else {
      lastTap.current = now;
    }
  };

  const quality = 0.2 + post.authorTier * 0.25;

  if (signed && post.media[0]?.kind === 'video' && !blurred) {
    return <VideoProof uri={signed} />;
  }

  return (
    <Pressable onPress={onTap} accessibilityLabel="Post photo, double tap for Clean technique">
      <View style={[styles.media, { aspectRatio: signed ? 4 / 5 : 16 / 10 }]}>
        {signed ? (
          <Image source={{ uri: signed }} style={styles.mediaImg} accessibilityLabel={`${post.skillName} practice`} />
        ) : (
          <Art
            seed={`${post.id}:${post.skillId}`}
            color={post.skillColor}
            letter={post.skillName}
            quality={quality}
            aspectRatio={16 / 10}
            style={blurred && { opacity: 0.35 }}
          />
        )}
        {post.selfie ? (
          <View style={styles.inset}>
            <Avatar name={post.authorName} color={post.authorColor} size={44} />
          </View>
        ) : null}
        {blurred ? (
          <View style={styles.blurOverlay}>
            <Icon name="lock" size={22} color="#FFFFFF" />
            <Text style={styles.blurText}>Post your Larp Check to see this</Text>
          </View>
        ) : null}
        {burst ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.burst,
              {
                opacity: burstAnim.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { scale: burstAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.4, 1.1, 1] }) },
                ],
              },
            ]}
          >
            <View style={[styles.burstBadge, { backgroundColor: colors.accent }]}>
              <Icon name="clap" filled size={30} color={colors.accentInk} />
              <Text style={[styles.burstText, { color: colors.accentInk }]}>Clean technique</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Stat({ label, value, dot }: { label: string; value: string; dot?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <View style={styles.statValueRow}>
        {dot ? <View style={[styles.statDot, { backgroundColor: dot }]} /> : null}
        <Text style={[styles.statValue, { color: colors.ink }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function PostCard({ post, meId }: { post: FeedPost; meId: string | undefined }) {
  const { colors } = useTheme();
  const toggleKudo = useToggleKudo();
  const toggleSave = useToggleSave();
  const isMe = meId === post.userId;

  const labels = kudoLabelsFor({ kudo_label: post.kudoLabel });
  const totalKudos = labels.reduce((sum, l) => sum + (post.kudoCounts[l] ?? 0), 0);

  const openProfile = () => {
    if (isMe) router.push('/(tabs)/profile');
    else router.push({ pathname: '/user/[id]', params: { id: post.userId } });
  };

  const openComments = () =>
    router.push({ pathname: '/comments/[id]', params: { id: post.id, kind: post.kind } });

  const share = () =>
    void Share.share({
      message: `${isMe ? 'My' : `${post.authorName}’s`} ${post.skillLower} session on Larping`,
    });

  const summary = [
    totalKudos > 0 ? `${totalKudos} ${totalKudos === 1 ? 'kudo' : 'kudos'}` : null,
    post.commentCount > 0 ? `${post.commentCount} ${post.commentCount === 1 ? 'comment' : 'comments'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: colors.bg, borderBottomColor: colors.line }]}>
      {/* header */}
      <View style={styles.head}>
        <Pressable onPress={openProfile} accessibilityLabel={`${post.authorName}’s profile`}>
          <Avatar name={post.authorName} color={post.authorColor} size={40} />
        </Pressable>
        <Pressable style={styles.headText} onPress={openProfile}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.ink }]}>
              {isMe ? 'You' : post.authorName}
            </Text>
            <TierPill tier={tierName(post.authorTier)} />
          </View>
          <Text numberOfLines={1} style={[styles.subline, { color: colors.muted }]}>
            {formatRelativeTime(post.at)} · @{post.authorHandle}
          </Text>
        </Pressable>
        {post.kind === 'larp_check' ? (
          <View style={[styles.badge, { backgroundColor: colors.heroSurface }]}>
            <Icon name="bolt" filled size={12} color={colors.accentStrong} />
            <Text style={[styles.badgeText, { color: colors.heroInk }]}>Larp Check</Text>
          </View>
        ) : null}
        {post.isLate ? (
          <View style={[styles.badge, { backgroundColor: colors.bad }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>Late</Text>
          </View>
        ) : null}
      </View>

      {/* caption + stats */}
      <View style={styles.body}>
        {post.note ? <Text style={[styles.caption, { color: colors.ink }]}>{post.note}</Text> : null}
        <View style={styles.stats}>
          <Stat label="Skill" value={post.skillName} dot={post.skillColor} />
          {post.minutes > 0 ? (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
              <Stat label="Time" value={formatDuration(post.minutes * 60)} />
            </>
          ) : null}
          {post.nodeName ? (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
              <Stat label={post.landed ? 'Landed' : 'Working on'} value={post.nodeName} />
            </>
          ) : null}
        </View>
        {post.label ? (
          <View style={[styles.tag, { backgroundColor: colors.goldSoft }]}>
            <Icon name="flag" size={12} color={colors.gold} />
            <Text style={[styles.tagText, { color: colors.ink }]}>{post.label}</Text>
          </View>
        ) : null}
      </View>

      {/* media, inset */}
      <View style={[styles.mediaWrap, { backgroundColor: colors.surface2 }]}>
        <PostMedia post={post} blurred={false} />
      </View>

      {/* kudos: the primary reaction */}
      <View style={styles.kudos}>
        {labels.map((label) => {
          const count = post.kudoCounts[label] ?? 0;
          const on = post.myKudos.includes(label);
          return (
            <PressableScale
              key={label}
              onPress={() => toggleKudo.mutate({ post, label, on })}
              scale={0.93}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label}, ${count} given`}
              style={[styles.kudo, { backgroundColor: on ? colors.accentSoft : colors.fill }]}
            >
              {on ? <Icon name="clap" filled size={13} color={colors.accentStrong} /> : null}
              <Text style={[styles.kudoText, { color: on ? colors.accentStrong : colors.ink }]}>{label}</Text>
              {count > 0 ? (
                <Text style={[styles.kudoCount, { color: on ? colors.accentStrong : colors.muted }]}>{count}</Text>
              ) : null}
            </PressableScale>
          );
        })}
      </View>

      {isMe && post.kind === 'session' ? (
        <Pressable
          onPress={() => router.push({ pathname: '/mentorship/ask', params: { skillId: post.skillId, sessionId: post.id } })}
          accessibilityLabel="Ask a mentor for feedback on this session"
          style={({ pressed }) => [styles.mentorLink, { backgroundColor: colors.surface2 }, pressed && { opacity: 0.6 }]}
        >
          <Icon name="mentor" size={17} color={colors.ink} />
          <Text style={[styles.mentorText, { color: colors.ink }]}>Ask a mentor for feedback</Text>
          <Icon name="chevron-right" size={12} color={colors.subtle} weight="semibold" />
        </Pressable>
      ) : null}

      {/* footer */}
      <View style={styles.footer}>
        <Pressable onPress={openComments} style={styles.summary} hitSlop={6} accessibilityLabel={`${post.commentCount} comments`}>
          <Text style={[styles.summaryText, { color: colors.muted }]} numberOfLines={1}>
            {summary || 'Be the first to react'}
          </Text>
        </Pressable>
        <IconButton name="comment" size={21} onPress={openComments} accessibilityLabel="Comment" />
        <IconButton name="share-up" size={21} onPress={share} accessibilityLabel="Share" />
        <IconButton
          name="bookmark"
          size={21}
          filled={post.savedByMe}
          onPress={() => toggleSave.mutate({ post, on: post.savedByMe })}
          accessibilityLabel={post.savedByMe ? 'Saved' : 'Save'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  headText: { flex: 1, minWidth: 0, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: -0.2, flexShrink: 1 },
  subline: { fontFamily: fonts.body, fontSize: 12.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, height: 24 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  caption: { fontFamily: fonts.display, fontSize: 18, lineHeight: 23, letterSpacing: -0.4, marginBottom: 14 },
  stats: { flexDirection: 'row', alignItems: 'stretch', gap: 18 },
  stat: { flexShrink: 1, minWidth: 0 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 11.5, marginBottom: 1 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statValue: { fontFamily: fonts.num, fontSize: 22, lineHeight: 25, fontVariant: ['tabular-nums'] },
  statDivider: { width: StyleSheet.hairlineWidth },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    height: 24,
    marginTop: 10,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  mediaWrap: { overflow: 'hidden', marginHorizontal: 16, borderRadius: 20 },
  media: { position: 'relative', overflow: 'hidden', width: '100%' },
  mediaImg: { width: '100%', height: '100%' },
  inset: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 66,
    height: 88,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#111427',
    backgroundColor: '#1C1F2A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blurText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 15 },
  burst: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  burstBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 18, height: 52 },
  burstText: { fontFamily: fonts.bold, fontSize: 15 },
  kudos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 12 },
  kudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
  },
  kudoText: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: -0.1 },
  kudoCount: { fontFamily: fonts.num, fontSize: 15, fontVariant: ['tabular-nums'] },
  mentorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
  },
  mentorText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13.5 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 16,
    paddingRight: 6,
    height: 48,
  },
  summary: { flex: 1, minWidth: 0 },
  summaryText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
});
