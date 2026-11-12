import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** card and flat = soft grey panel on the white canvas; raised = white with a soft shadow (floating heroes). */
  variant?: 'card' | 'flat' | 'raised';
};

export function Card({ children, style, variant = 'card' }: CardProps) {
  const { colors, elevation, isDark } = useTheme();
  const look =
    variant === 'raised'
      ? { backgroundColor: colors.surface, ...elevation.raised }
      : { backgroundColor: isDark ? colors.surface : colors.surface2 };
  return <View style={[styles.card, look, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
  },
});
