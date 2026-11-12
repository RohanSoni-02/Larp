import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { fonts, useTheme } from '@/src/theme';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** lg and md stretch to the container; sm hugs its label. */
  size?: 'lg' | 'md' | 'sm';
  icon?: AppIconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryInk, border: colors.primary },
    accent: { bg: colors.accent, fg: colors.accentInk, border: colors.accent },
    secondary: { bg: colors.fill, fg: colors.ink, border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.ink, border: colors.surface3 },
    ghost: { bg: 'transparent', fg: colors.ink, border: 'transparent' },
    danger: { bg: 'transparent', fg: colors.bad, border: 'transparent' },
  };
  const { bg, fg, border } = palette[variant];
  const filled = variant === 'primary' || variant === 'accent';
  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      scale={size === 'sm' ? 0.95 : 0.975}
      pressedOpacity={filled ? 0.92 : 0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        sizeStyle,
        { backgroundColor: bg, borderColor: border },
        // The main action lifts off the page on a shadow of its own colour.
        filled && size !== 'sm' && !isDisabled && !isDark && [styles.lift, { shadowColor: bg }],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} color={fg} weight="semibold" /> : null}
          <Text
            numberOfLines={1}
            style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]}
          >
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  lift: { shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  lg: { height: 56, paddingHorizontal: 22 },
  md: { height: 50, paddingHorizontal: 20 },
  sm: { height: 34, paddingHorizontal: 14, width: 'auto' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.2 },
  labelSm: { fontSize: 13.5, letterSpacing: -0.1 },
});
