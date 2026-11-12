import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Art } from '@/src/components/Art';
import { Avatar } from '@/src/components/Avatar';
import { Icon } from '@/src/components/Icon';
import { IconButton } from '@/src/components/IconButton';
import { Scrim } from '@/src/components/Scrim';
import { TierPill } from '@/src/components/TierPill';
import { useSignedUrl } from '@/src/features/media/api';
import { useStoryPosts } from '@/src/features/posts/hooks';
import { formatDuration, formatTime } from '@/src/lib/format';
import { useUiStore } from '@/src/stores/ui';
import { fonts, useTheme } from '@/src/theme';
import { tierName } from '@/src/types/app';

const STORY_MS = 5000;

export default function StoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 12);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: posts } = useStoryPosts();
  const markStorySeen = useUiStore((s) => s.markStorySeen);

  const items = useMemo(() => (posts ?? []).filter((p) => p.userId === userId), [posts, userId]);
  const [index, setIndex] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  const item = items[Math.min(index, items.length - 1)];
  const mediaUrl = useSignedUrl(item?.media[0]?.key ?? null);

  function advance(dir: 1 | -1) {
    const next = index + dir;
    if (next < 0) return;
    if (next >= items.length) router.back();
    else setIndex(next);
  }

  useEffect(() => {
    if (!item) return;
    markStorySeen(`${item.kind}:${item.id}`);
    progress.setValue(0);
    const anim = Animated.timing(progress, { toValue: 1, duration: STORY_MS, useNativeDriver: false });
    anim.start(({ finished }) => {
      if (finished) advance(1);
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) {
    return (
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <View style={styles.emptyWrap}>
          <Text style={styles.captionText}>Nothing posted today</Text>
          <Text style={styles.note}>Stories last until midnight.</Text>
        </View>
        <IconButton
          name="close"
          variant="glass"
          size={18}
          onPress={() => router.back()}
          accessibilityLabel="Close story"
          style={[styles.close, { top: top + 8 }]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      {/* Media */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={(e) => advance(e.nativeEvent.locationX < 120 ? -1 : 1)}
        accessibilityLabel="Story. Tap the left edge to go back, anywhere else for the next one"
      >
        {mediaUrl ? (
          <Image source={{ uri: mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Art seed={item.id} color={item.skillColor} letter={item.skillName} quality={0.7} aspectRatio={0.55} style={StyleSheet.absoluteFill} />
        )}
      </Pressable>
      <Scrim edge="top" extent={0.24} opacity={0.5} />
      <Scrim edge="bottom" extent={0.42} opacity={0.72} />

      {/* Progress bars */}
      <View style={[styles.bars, { top: top + 4 }]}>
        {items.map((it, i) => (
          <View key={`${it.kind}:${it.id}`} style={styles.barTrack}>
            {i < index ? (
              <View style={[styles.barFill, { width: '100%' }]} />
            ) : i === index ? (
              <Animated.View
                style={[styles.barFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
              />
            ) : null}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={[styles.header, { top: top + 18 }]} pointerEvents="box-none">
        <Avatar name={item.authorName} color={item.authorColor} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.authorName}</Text>
          <Text style={styles.time}>{formatTime(item.at)}</Text>
        </View>
        <TierPill tier={tierName(item.authorTier)} showDayOne={false} />
        <IconButton name="close" variant="glass" size={18} onPress={() => router.back()} accessibilityLabel="Close story" />
      </View>

      {/* Caption */}
      <View style={[styles.caption, { bottom: Math.max(insets.bottom, 16) + 20 }]} pointerEvents="none">
        {item.kind === 'larp_check' ? (
          <View style={[styles.lcPill, { backgroundColor: item.isLate ? 'rgba(0,0,0,0.5)' : colors.accent }]}>
            <Icon name="bolt" filled size={13} color="#FFFFFF" />
            <Text style={styles.lcPillText}>{item.isLate ? 'Late Larp Check' : 'Larp Check, on time'}</Text>
          </View>
        ) : (
          <View style={styles.skillPill}>
            <View style={[styles.skillDot, { backgroundColor: item.skillColor }]} />
            <Text style={styles.lcPillText}>{item.skillName}</Text>
          </View>
        )}
        <Text style={styles.captionText}>
          {item.kind === 'larp_check'
            ? `${item.skillName}, right now`
            : `${formatDuration(item.minutes * 60)} of ${item.skillLower}`}
        </Text>
        {item.kind !== 'larp_check' && item.nodeName ? (
          <Text style={styles.node}>
            {item.landed ? 'Landed' : 'Working on'} {item.nodeName}
          </Text>
        ) : null}
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: { position: 'absolute', right: 12 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bars: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2, backgroundColor: '#fff' },
  header: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  time: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 12.5 },
  caption: { position: 'absolute', left: 18, right: 18, gap: 8 },
  lcPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, height: 28 },
  skillPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, height: 28, backgroundColor: 'rgba(0,0,0,0.4)' },
  skillDot: { width: 8, height: 8, borderRadius: 4 },
  lcPillText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 13 },
  captionText: { color: '#fff', fontFamily: fonts.displayHeavy, fontSize: 28, lineHeight: 32, letterSpacing: -0.9 },
  node: { color: 'rgba(255,255,255,0.92)', fontFamily: fonts.bodyBold, fontSize: 15 },
  note: { color: 'rgba(255,255,255,0.88)', fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
});
