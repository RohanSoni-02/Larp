import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { shade } from '@/src/lib/color';

/**
 * Procedural cover art for posts without uploaded media — deterministic per
 * seed, a soft gradient in the skill colour with topographic contour rings.
 * "quality" (0..1) adds depth so stronger practitioners get richer tiles.
 */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type ArtProps = {
  seed: string;
  color: string;
  /** Kept for API compatibility; the cover no longer renders a letter. */
  letter?: string;
  quality?: number; // 0..1
  aspectRatio?: number; // width / height
  style?: StyleProp<ViewStyle>;
};

export function Art({ seed, color, quality = 0.5, aspectRatio = 1, style }: ArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = rng(seed);
  const blobs = Array.from({ length: 2 + Math.round(quality * 2) }, (_, i) => ({
    key: i,
    cx: Math.round(40 + r() * 320),
    cy: Math.round(40 + r() * 320),
    rad: Math.round(150 + r() * 120),
    tint: shade(color, i % 2 === 0 ? 70 : -40),
  }));
  const ringCenter = { x: Math.round(80 + r() * 240), y: Math.round(80 + r() * 240) };
  const rings = 4 + Math.round(quality * 6);
  const tilt = 0.7 + r() * 0.5;

  return (
    <View style={[styles.wrap, { aspectRatio }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${uid}bg`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={shade(color, 18)} />
            <Stop offset="1" stopColor={shade(color, -55)} />
          </LinearGradient>
          {blobs.map((b) => (
            <RadialGradient key={b.key} id={`${uid}b${b.key}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={b.tint} stopOpacity={0.75} />
              <Stop offset="1" stopColor={b.tint} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect width="400" height="400" fill={`url(#${uid}bg)`} />
        {blobs.map((b) => (
          <Circle key={b.key} cx={b.cx} cy={b.cy} r={b.rad} fill={`url(#${uid}b${b.key})`} />
        ))}
        {Array.from({ length: rings }, (_, i) => (
          <Ellipse
            key={i}
            cx={ringCenter.x}
            cy={ringCenter.y}
            rx={30 + i * 34}
            ry={(30 + i * 34) * tilt}
            stroke="#FFFFFF"
            strokeOpacity={0.13 - i * 0.008}
            strokeWidth={1.6}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden' },
});
