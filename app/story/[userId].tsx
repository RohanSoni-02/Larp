import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Art } from '@/src/components/Art';
import { Avatar } from '@/src/components/Avatar';
import { Icon } from '@/src/components/Icon';
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
        <Pressable style={styles.close} onPress={() => router.back()} accessibilityLabel="Close story">
          <Icon name="close" size={22} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      {/* Media */}
      <Pressable style={StyleSheet.absoluteFill} onPress={(e) => advance(e.nativeEvent.locationX < 120 ? -1 : 1)}>
        {mediaUrl ? (
          <Image source={{ uri: mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Art seed={item.id} color={item.skillColor} letter={item.skillName} quality={0.7} aspectRatio={0.55} style={StyleSheet.absoluteFill} />
        )}
      </Pressable>

      {/* Progress bars */}
      <View style={styles.bars}>
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
      <View style={styles.header}>
        <Avatar name={item.authorName} color={item.authorColor} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.authorName}</Text>
          <Text style={styles.time}>{formatTime(item.at)}</Text>
        </View>
        <TierPill tier={tierName(item.authorTier)} showDayOne={false} />
        <Pressable onPress={() => router.back()} accessibilityLabel="Close story" hitSlop={12}>
          <Icon name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        {item.kind === 'larp_check' ? (
          <View style={[styles.lcPill, { backgroundColor: item.isLate ? '#00000088' : colors.gold }]}>
            <Text style={[styles.lcPillText, { color: item.isLate ? '#fff' : '#1B1505' }]}>
              {item.isLate ? '⚡ Late Larp Check' : '⚡ Larp Check, on time'}
            </Text>
          </View>
        ) : null}
        <Text style={styles.captionText}>
          {item.kind === 'larp_check'
            ? `${item.skillName}, right now`
            : `${formatDuration(item.minutes * 60)} of ${item.skillLower}${item.nodeName ? ` · ${item.nodeName}` : ''}`}
        </Text>
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: { position: 'absolute', top: 60, right: 20 },
  bars: { position: 'absolute', top: 54, left: 12, right: 12, flexDirection: 'row', gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2, backgroundColor: '#fff' },
  header: {
    position: 'absolute',
    top: 66,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  time: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 12.5 },
  caption: { position: 'absolute', left: 16, right: 16, bottom: 40, gap: 8 },
  lcPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  lcPillText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  captionText: { color: '#fff', fontFamily: fonts.display, fontSize: 22, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  note: { color: 'rgba(255,255,255,0.92)', fontFamily: fonts.body, fontSize: 15, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
});
