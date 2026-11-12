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

/** Outlined glyph, title and one line of guidance — used wherever a list can be empty. */
export function EmptyState({ icon, title, body, action, compact = false }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.icon, { borderColor: colors.ink }]}>
        <Icon name={icon} size={26} color={colors.ink} />
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
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.35, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 14.5, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  action: { marginTop: 16 },
});
