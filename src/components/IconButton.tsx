import { StyleSheet, Text, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { fonts, useTheme } from '@/src/theme';

type IconButtonProps = {
  name: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: ColorValue;
  filled?: boolean;
  /** plain = bare glyph, tonal = soft circle, glass = dark scrim for use over media. */
  variant?: 'plain' | 'tonal' | 'glass';
  /** Unread count; 0 hides it. */
  badge?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  size = 24,
  color,
  filled,
  variant = 'plain',
  badge = 0,
  disabled,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const bg = variant === 'tonal' ? colors.surface2 : variant === 'glass' ? 'rgba(0,0,0,0.42)' : 'transparent';
  const tint = color ?? (variant === 'glass' ? '#FFFFFF' : colors.ink);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scale={0.88}
      pressedOpacity={0.6}
      disabledOpacity={0.35}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, variant !== 'plain' && styles.round, { backgroundColor: bg }, style]}
    >
      <Icon name={name} size={size} color={tint} filled={filled} />
      {badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.bad, borderColor: colors.bg }]}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  round: { width: 36, height: 36, borderRadius: 18 },
  badge: {
    position: 'absolute',
    top: 3,
    right: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 },
});
