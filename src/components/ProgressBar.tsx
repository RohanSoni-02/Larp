import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/src/theme';
import { durations, easings } from '@/src/theme/motion';

type ProgressBarProps = {
  /** 0..1 */
  progress: number;
  gold?: boolean;
  /** Fill colour override (e.g. a skill colour). */
  color?: string;
  trackColor?: string;
  height?: number;
};

/** Progress track whose fill grows to its value, so gains are seen, not just read. */
export function ProgressBar({ progress, gold = false, color, trackColor, height = 6 }: ProgressBarProps) {
  const { colors, isDark } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const fill = color ?? (gold ? colors.gold : colors.accent);
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(reduceMotion ? clamped : 0);

  useEffect(() => {
    shown.value = reduceMotion ? clamped : withTiming(clamped, { duration: durations.slow, easing: easings.out });
  }, [clamped, reduceMotion, shown]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${shown.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { backgroundColor: trackColor ?? (isDark ? colors.surface3 : colors.surface2), height, borderRadius: height },
      ]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill, borderRadius: height }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
