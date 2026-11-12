import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, useTheme } from '@/src/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** Trailing text link ("See all"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Custom trailing node, used instead of actionLabel. */
  action?: ReactNode;
};

/** Section title with an optional trailing link — anchors each feed module. */
export function SectionHeader({ title, subtitle, actionLabel, onAction, action }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {action ??
        (actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button" accessibilityLabel={actionLabel}>
            <Text style={[styles.action, { color: colors.accentStrong }]}>{actionLabel}</Text>
          </Pressable>
        ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  text: { flex: 1 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 26, letterSpacing: -0.7 },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, marginTop: 3, letterSpacing: -0.05 },
  action: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15, paddingBottom: 1 },
});
