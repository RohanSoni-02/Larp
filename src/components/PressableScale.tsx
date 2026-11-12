import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/src/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale while held. Big surfaces want less (0.98), small targets more (0.94). */
  scale?: number;
  /** Opacity while held; 1 leaves it untouched. */
  pressedOpacity?: number;
  disabledOpacity?: number;
};

/**
 * The app's one press behaviour: the surface gives under the finger and
 * springs back on release. Runs on the UI thread, so it tracks the touch even
 * while JS is busy. With reduced motion on it dims instead of scaling.
 */
export function PressableScale({
  children,
  style,
  scale = 0.97,
  pressedOpacity = 1,
  disabledOpacity = 0.4,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const isDisabled = Boolean(disabled);
  const heldOpacity = reduceMotion ? Math.min(pressedOpacity, 0.7) : pressedOpacity;
  const heldScale = reduceMotion ? 1 : scale;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isDisabled ? disabledOpacity : 1 + (heldOpacity - 1) * pressed.value,
    transform: [{ scale: 1 + (heldScale - 1) * pressed.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withSpring(1, springs.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, springs.press);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
