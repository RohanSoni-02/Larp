import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { fonts, useTheme } from '@/src/theme';

type ListGroupProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

/** Inset grouped list (settings style): sentence-case title, hairline-separated rows. */
export function ListGroup({ title, footer, children }: ListGroupProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.group}>
      {title ? <Text style={[styles.groupTitle, { color: colors.muted }]}>{title}</Text> : null}
      <View style={[styles.groupBody, { backgroundColor: colors.surface2 }]}>
        {rows.map((row, i) => (
          <Fragment key={row.key ?? i}>
            {i > 0 ? <View style={[styles.sep, { backgroundColor: colors.surface3 }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={[styles.groupFooter, { color: colors.subtle }]}>{footer}</Text> : null}
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: AppIconName;
  /** Trailing secondary text ("On", "7:30 PM"). */
  value?: string;
  /** Custom trailing control (Switch…); replaces value + chevron. */
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  /** Unread/pending count; 0 hides it. */
  badge?: number;
  accessibilityLabel?: string;
};

export function ListRow({
  title,
  subtitle,
  icon,
  value,
  right,
  onPress,
  destructive = false,
  chevron,
  badge = 0,
  accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();
  const tint = destructive ? colors.bad : colors.ink;
  const showChevron = chevron ?? (!!onPress && !right && !destructive);
  const body = (
    <>
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={20} color={tint} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.bad }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
      {right ?? (value ? <Text style={[styles.value, { color: colors.muted }]}>{value}</Text> : null)}
      {showChevron ? <Icon name="chevron-right" size={14} color={colors.subtle} weight="semibold" /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessibilityLabel={accessibilityLabel}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface3 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 22 },
  groupTitle: { fontFamily: fonts.bodyBold, fontSize: 13, marginBottom: 8, marginLeft: 4, letterSpacing: -0.05 },
  groupBody: { borderRadius: 16, overflow: 'hidden' },
  groupFooter: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 8, marginHorizontal: 4, lineHeight: 17 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 11 },
  iconWrap: { width: 24, alignItems: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 15.5, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, marginTop: 2, lineHeight: 17 },
  value: { fontFamily: fonts.body, fontSize: 15, letterSpacing: -0.15 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 11.5 },
});
