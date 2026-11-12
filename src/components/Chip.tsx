import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { fonts, useTheme } from '@/src/theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Identity colour (e.g. a skill) shown as a leading dot. */
  color?: string;
  icon?: AppIconName;
  size?: 'md' | 'sm';
};

export function Chip({ label, selected, onPress, color, icon, size = 'md' }: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.bg : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.sm,
        {
          backgroundColor: selected ? colors.ink : colors.fill,
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {icon ? (
        <Icon name={icon} size={size === 'sm' ? 13 : 15} color={fg} weight="semibold" />
      ) : color ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : null}
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  sm: { height: 30, paddingHorizontal: 12, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.2 },
  labelSm: { fontSize: 13 },
});
