import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { fonts, useTheme } from '@/src/theme';

type EmptyStateProps = {
  icon: AppIconName;
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
};

/** Tonal glyph tile, title and one line of guidance — used wherever a list can be empty. */
export function EmptyState({ icon, title, body, action, compact = false }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.icon, { backgroundColor: colors.surface2 }]}>
        <Icon name={icon} size={26} color={colors.muted} />
      </View>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: colors.muted }]}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  compact: { paddingVertical: 24 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.35, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 14.5, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 300 },
  action: { marginTop: 16 },
});
