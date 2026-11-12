import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/src/components/IconButton';
import { fonts, GUTTER, typography, useTheme } from '@/src/theme';

type TopBarProps = {
  title?: string;
  /** Replaces the title (e.g. the wordmark). */
  left?: ReactNode;
  right?: ReactNode;
};

/** Tab-root header: left-aligned bold title, icon actions on the right. */
export function TopBar({ title, left, right }: TopBarProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.topBar}>
      <View style={styles.topLeft}>
        {left ?? (
          <Text style={[typography.largeTitle, { color: colors.ink }]} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      {right ? <View style={styles.actions}>{right}</View> : null}
    </View>
  );
}

type NavBarProps = {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: ReactNode;
  /** Hairline under the bar. */
  divider?: boolean;
  /** Light glyphs for dark/full-bleed screens. */
  tint?: string;
};

/** Stack/modal header: back chevron or close glyph, centred title, optional trailing action. */
export function NavBar({ title, onBack, onClose, right, divider = false, tint }: NavBarProps) {
  const { colors } = useTheme();
  const color = tint ?? colors.ink;
  return (
    <View style={[styles.navBar, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }]}>
      <View style={styles.navSide}>
        {onBack ? (
          <IconButton name="back" onPress={onBack} accessibilityLabel="Back" color={color} size={22} />
        ) : onClose ? (
          <IconButton name="close" onPress={onClose} accessibilityLabel="Close" color={color} size={22} />
        ) : null}
      </View>
      {title ? (
        <Text style={[styles.navTitle, { color }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={[styles.navSide, styles.navRight]}>{right}</View>
    </View>
  );
}

/** Text action for NavBar's trailing slot ("Save", "Post", "Done"). */
export function NavAction({
  label,
  onPress,
  disabled,
  tone = 'ink',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'ink' | 'muted' | 'bad';
}) {
  const { colors } = useTheme();
  const color = tone === 'bad' ? colors.bad : tone === 'muted' ? colors.muted : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ opacity: disabled ? 0.35 : pressed ? 0.55 : 1, paddingHorizontal: 6 })}
    >
      <Text style={[styles.navAction, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: GUTTER,
    gap: 6,
  },
  topLeft: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: -8 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 6,
  },
  navSide: { width: 76, flexDirection: 'row', alignItems: 'center' },
  navRight: { justifyContent: 'flex-end', paddingRight: 6 },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: -0.2 },
  navAction: { fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.2 },
});
