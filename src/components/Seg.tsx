import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { fonts, GUTTER, useTheme } from '@/src/theme';
import { springs } from '@/src/theme/motion';

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

type Box = { x: number; width: number };

/**
 * One indicator that travels between options instead of blinking from one to
 * the next, so the eye is led to the new selection. It snaps into place the
 * first time it is measured and slides from then on.
 */
function useSlidingIndicator(target: Box | undefined) {
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const placed = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!target) return;
    if (placed.value === 0 || reduceMotion) {
      x.value = target.x;
      width.value = target.width;
      placed.value = 1;
    } else {
      x.value = withSpring(target.x, springs.slide);
      width.value = withSpring(target.width, springs.slide);
    }
  }, [target?.x, target?.width, reduceMotion, x, width, placed]); // eslint-disable-line react-hooks/exhaustive-deps

  return useAnimatedStyle(() => ({ opacity: placed.value, width: width.value, transform: [{ translateX: x.value }] }));
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  variant = 'segmented',
  iconOnly = false,
  scrollable = false,
}: SegProps<T>) {
  const { colors, elevation, isDark } = useTheme();
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const indicatorStyle = useSlidingIndicator(boxes[value]);

  const measure = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setBoxes((prev) => (prev[key]?.x === x && prev[key]?.width === width ? prev : { ...prev, [key]: { x, width } }));
  };

  if (variant === 'tabs') {
    const tabs = options.map((opt) => {
      const selected = opt.value === value;
      const tint = selected ? colors.ink : colors.subtle;
      return (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          onLayout={measure(opt.value)}
          hitSlop={{ left: 8, right: 8 }}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={opt.label}
          style={({ pressed }) => [styles.tab, iconOnly && styles.tabIconOnly, { opacity: pressed && !selected ? 0.6 : 1 }]}
        >
          {opt.icon ? <Icon name={opt.icon} size={iconOnly ? 21 : 16} color={tint} filled={selected} /> : null}
          {!iconOnly ? (
            <Text style={[styles.tabLabel, { color: tint, fontFamily: selected ? fonts.bodyBold : fonts.bodyMedium }]}>
              {opt.label}
            </Text>
          ) : null}
        </Pressable>
      );
    });
    const underline = <Animated.View pointerEvents="none" style={[styles.tabBar, { backgroundColor: colors.ink }, indicatorStyle]} />;

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
          {underline}
        </ScrollView>
      );
    }
    return (
      <View style={[styles.tabsContent, styles.tabsRow, styles.tabsRule, rule]} accessibilityRole="tablist">
        {tabs}
        {underline}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.fill }]} accessibilityRole="tablist">
      <Animated.View
        pointerEvents="none"
        style={[styles.thumb, { backgroundColor: isDark ? colors.surface3 : colors.surface }, elevation.card, indicatorStyle]}
      />
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            onLayout={measure(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => [styles.btn, { opacity: pressed && !selected ? 0.6 : 1 }]}
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
  wrap: { flexDirection: 'row', borderRadius: 13, padding: 3, gap: 2 },
  thumb: { position: 'absolute', left: 0, top: 3, bottom: 3, borderRadius: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, letterSpacing: -0.15 },
  tabsScroll: { flexGrow: 0 },
  tabsRule: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: GUTTER, gap: 22 },
  tabsRow: { flexDirection: 'row' },
  tab: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabBar: { position: 'absolute', left: 0, bottom: 0, height: 2.5, borderRadius: 2 },
  tabIconOnly: { minWidth: 44, justifyContent: 'center' },
  tabLabel: { fontSize: 15, letterSpacing: -0.25 },
});
