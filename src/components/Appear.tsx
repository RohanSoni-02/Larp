import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { durations, easings } from '@/src/theme/motion';

type AppearProps = {
  children: ReactNode;
  /** Milliseconds before the entrance starts; step this to stagger a group. */
  delay?: number;
  /** Distance travelled upwards while fading in. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/** Content settles into place on mount: a short rise and fade, opacity only under reduced motion. */
export function Appear({ children, delay = 0, offset = 10, style }: AppearProps) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const travel = reduceMotion ? 0 : offset;

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: durations.enter, easing: easings.out }));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * travel }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
