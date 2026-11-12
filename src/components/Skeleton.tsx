import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GUTTER, useTheme } from '@/src/theme';
import { easings } from '@/src/theme/motion';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Placeholder block that breathes while content loads. */
export function Skeleton({ width = '100%', height = 14, radius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(0.45, { duration: 900, easing: easings.inOut }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surface2 }, animatedStyle, style]} />;
}

/** Stand-in for a feed post while the feed loads, matching PostCard's layout. */
export function PostSkeleton() {
  return (
    <View style={styles.post} accessibilityLabel="Loading posts">
      <View style={styles.head}>
        <Skeleton width={40} height={40} radius={13} />
        <View style={styles.headText}>
          <Skeleton width={140} height={13} />
          <Skeleton width={90} height={11} />
        </View>
      </View>
      <Skeleton width="82%" height={18} />
      <Skeleton width="100%" height={210} radius={18} />
      <View style={styles.row}>
        <Skeleton width={120} height={32} radius={16} />
        <Skeleton width={84} height={32} radius={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  post: { paddingHorizontal: GUTTER, paddingTop: 18, paddingBottom: 14, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { gap: 7 },
  row: { flexDirection: 'row', gap: 6 },
});
