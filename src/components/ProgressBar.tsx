import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/src/theme';

type ProgressBarProps = {
  /** 0..1 */
  progress: number;
  gold?: boolean;
  /** Fill colour override (e.g. a skill colour). */
  color?: string;
  trackColor?: string;
  height?: number;
};

export function ProgressBar({ progress, gold = false, color, trackColor, height = 6 }: ProgressBarProps) {
  const { colors, isDark } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const fill = color ?? (gold ? colors.gold : colors.accent);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { backgroundColor: trackColor ?? (isDark ? colors.surface3 : colors.surface2), height, borderRadius: height },
      ]}
    >
      <View style={[styles.fill, { backgroundColor: fill, width: `${clamped * 100}%`, borderRadius: height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
