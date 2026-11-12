import { useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { storyRing, useTheme } from '@/src/theme';

type StoryRingProps = {
  /** Outer diameter including the ring. */
  size: number;
  state: 'unseen' | 'seen' | 'none';
  children: ReactNode;
};

/** Gradient story ring around an avatar; seen stories fall back to a hairline. */
export function StoryRing({ size, state, children }: StoryRingProps) {
  const { colors } = useTheme();
  const gradientId = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const stroke = state === 'unseen' ? 2.5 : 1;
  const r = (size - stroke) / 2;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {state !== 'none' ? (
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={storyRing[2]} />
              <Stop offset="0.55" stopColor={storyRing[1]} />
              <Stop offset="1" stopColor={storyRing[0]} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={state === 'unseen' ? `url(#${gradientId})` : colors.surface3}
            strokeWidth={stroke}
            fill="none"
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
