import { useEvent } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { fonts } from '@/src/theme';

const SPEEDS = [0.25, 0.5, 1] as const;
const FRAME_SEC = 1 / 30;

// The player is a native handle, not React state; it's mutated imperatively.
function seekTo(player: VideoPlayer, seconds: number) {
  player.currentTime = Math.max(0, Math.min(player.duration || 0, seconds));
}

function setRate(player: VideoPlayer, rate: number) {
  player.playbackRate = rate;
}

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  /** Start in slow motion (e.g. when a mentor reviews technique). */
  initialSpeed?: (typeof SPEEDS)[number];
};

/**
 * Video proof with coach-style controls: 0.25× / 0.5× / 1× playback,
 * frame-by-frame stepping and a scrubber. Audio pitch is kept natural.
 */
export function VideoProof({ uri, style, initialSpeed = 1 }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.preservesPitch = true;
    p.playbackRate = initialSpeed;
    p.timeUpdateEventInterval = 0.1;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const time = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(initialSpeed);
  const [barWidth, setBarWidth] = useState(1);

  const duration = player.duration || 0;
  const progress = duration > 0 ? Math.min(1, time.currentTime / duration) : 0;

  const step = (dir: 1 | -1) => {
    player.pause();
    seekTo(player, player.currentTime + dir * FRAME_SEC);
  };

  const chooseSpeed = (s: (typeof SPEEDS)[number]) => {
    setSpeed(s);
    setRate(player, s);
    if (!player.playing) player.play();
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => (isPlaying ? player.pause() : player.play())}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause clip' : 'Play clip'}
      >
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
        {!isPlaying ? (
          <View style={styles.playBadge}>
            <Icon name="play" size={22} color="#fff" />
          </View>
        ) : null}
      </Pressable>

      {speed < 1 ? (
        <View style={styles.slowTag} pointerEvents="none">
          <Text style={styles.slowText}>Slow-mo {speed}×</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          style={styles.bar}
          onLayout={(e: LayoutChangeEvent) => setBarWidth(Math.max(1, e.nativeEvent.layout.width))}
          onPress={(e) => seekTo(player, (e.nativeEvent.locationX / barWidth) * duration)}
          accessibilityRole="adjustable"
          accessibilityLabel="Scrub clip"
        >
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </Pressable>
        <View style={styles.row}>
          <Pressable onPress={() => step(-1)} style={styles.ctl} accessibilityLabel="Back one frame" hitSlop={6}>
            <Icon name="frame-back" size={14} color="#fff" />
          </Pressable>
          <Pressable onPress={() => step(1)} style={styles.ctl} accessibilityLabel="Forward one frame" hitSlop={6}>
            <Icon name="frame-forward" size={14} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
          {SPEEDS.map((s) => (
            <Pressable
              key={s}
              onPress={() => chooseSpeed(s)}
              style={[styles.ctl, speed === s && styles.ctlOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: speed === s }}
              accessibilityLabel={`Playback speed ${s} times`}
              hitSlop={6}
            >
              <Text style={[styles.ctlText, speed === s && styles.ctlTextOn]}>{s}×</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { aspectRatio: 4 / 5, backgroundColor: '#000', overflow: 'hidden' },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 56,
    height: 56,
    marginTop: -28,
    marginLeft: -28,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slowTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  slowText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 12 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bar: { height: 14, justifyContent: 'center' },
  barFill: { height: 2.5, borderRadius: 2, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ctl: {
    minWidth: 34,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  ctlOn: { backgroundColor: '#fff' },
  ctlText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 12.5 },
  ctlTextOn: { color: '#000' },
});
