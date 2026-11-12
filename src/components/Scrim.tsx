import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type ScrimProps = {
  /** Which edge the shade sits on. */
  edge?: 'bottom' | 'top';
  /** Fraction of the parent covered (0–1). */
  extent?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/** Gradient shade that keeps overlaid white text legible on photos and art. */
export function Scrim({ edge = 'bottom', extent = 0.55, opacity = 0.62, style }: ScrimProps) {
  const id = `scrim${useId().replace(/:/g, '')}`;
  const bottom = edge === 'bottom';
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, bottom ? { bottom: 0 } : { top: 0 }, { height: `${Math.round(extent * 100)}%` }, style]}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1={bottom ? '0' : '1'} x2="0" y2={bottom ? '1' : '0'}>
            <Stop offset="0" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={opacity} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0 },
});
