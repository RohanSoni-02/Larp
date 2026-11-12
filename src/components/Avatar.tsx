import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { isLightColor, shade } from '@/src/lib/color';
import { initials } from '@/src/lib/format';
import { fonts } from '@/src/theme';

type AvatarProps = {
  name: string;
  color?: string;
  size?: number;
  /** Rounded square is the house style; circle for podiums and tight clusters. */
  shape?: 'squircle' | 'circle';
};

/** Corner radius for the house rounded-square avatar at a given size. */
export const avatarRadius = (size: number) => Math.round(size * 0.32);

/** Initials avatar on a soft gradient of the user's colour. */
export function Avatar({ name, color = '#5E6377', size = 40, shape = 'squircle' }: AvatarProps) {
  const gradientId = `av${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ink = isLightColor(color) ? '#111427' : '#FFFFFF';
  const radius = shape === 'circle' ? size / 2 : avatarRadius(size);
  return (
    <View
      accessibilityLabel={`Avatar of ${name}`}
      style={[styles.avatar, { width: size, height: size, borderRadius: radius, backgroundColor: color }]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={shade(color, 34)} />
            <Stop offset="1" stopColor={shade(color, -26)} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${gradientId})`} />
      </Svg>
      <Text
        style={[styles.text, { color: ink, fontSize: Math.max(10, Math.round(size * 0.36)), letterSpacing: size > 48 ? -0.6 : -0.2 }]}
        allowFontScaling={false}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { fontFamily: fonts.bold },
});
