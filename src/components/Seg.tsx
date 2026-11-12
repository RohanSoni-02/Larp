import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { fonts, GUTTER, useTheme } from '@/src/theme';

type SegOption<T extends string> = { value: T; label: string; icon?: AppIconName };

type SegProps<T extends string> = {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** segmented = equal-width control; tabs = pill tabs (feeds, sections, profile). */
  variant?: 'segmented' | 'tabs';
  /** Tabs show only the icon. */
  iconOnly?: boolean;
  /** Tabs scroll horizontally (many sections). */
  scrollable?: boolean;
};

export function Seg<T extends string>({
  options,
  value,
  onChange,
  variant = 'segmented',
  iconOnly = false,
  scrollable = false,
}: SegProps<T>) {
  const { colors, elevation } = useTheme();

  if (variant === 'tabs') {
    const tabs = options.map((opt) => {
      const selected = opt.value === value;
      const tint = selected ? colors.ink : colors.subtle;
      return (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={opt.label}
          style={({ pressed }) => [styles.tab, iconOnly && styles.tabIconOnly, { opacity: pressed && !selected ? 0.6 : 1 }]}
        >
          <View style={styles.tabInner}>
            {opt.icon ? <Icon name={opt.icon} size={iconOnly ? 21 : 16} color={tint} filled={selected} /> : null}
            {!iconOnly ? (
              <Text style={[styles.tabLabel, { color: tint, fontFamily: selected ? fonts.bodyBold : fonts.bodyMedium }]}>
                {opt.label}
              </Text>
            ) : null}
          </View>
          <View style={[styles.tabBar, { backgroundColor: selected ? colors.ink : 'transparent' }]} />
        </Pressable>
      );
    });

    const rule = { borderBottomColor: colors.line };
    if (scrollable) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          style={[styles.tabsScroll, styles.tabsRule, rule]}
          accessibilityRole="tablist"
        >
          {tabs}
        </ScrollView>
      );
    }
    return (
      <View style={[styles.tabsContent, styles.tabsRow, styles.tabsRule, rule]} accessibilityRole="tablist">
        {tabs}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.fill }]} accessibilityRole="tablist">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={[styles.btn, selected && [{ backgroundColor: colors.surface }, elevation.card]]}
          >
            {opt.icon ? <Icon name={opt.icon} size={15} color={selected ? colors.ink : colors.muted} /> : null}
            <Text
              style={[
                styles.label,
                { color: selected ? colors.ink : colors.muted, fontFamily: selected ? fonts.bodyBold : fonts.bodyMedium },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 2 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 9,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, letterSpacing: -0.15 },
  tabsScroll: { flexGrow: 0 },
  tabsRule: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: GUTTER, gap: 22 },
  tabsRow: { flexDirection: 'row' },
  tab: { height: 44, justifyContent: 'flex-end' },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  tabBar: { height: 2.5, borderRadius: 2 },
  tabIconOnly: { minWidth: 44, alignItems: 'center' },
  tabLabel: { fontSize: 15, letterSpacing: -0.25 },
});
