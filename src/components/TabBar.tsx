import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { fonts, GUTTER, useTheme } from '@/src/theme';
import { springs } from '@/src/theme/motion';

const BAR_HEIGHT = 62;
const INSET = 5;

/** The icon dips and springs back when its tab becomes active. */
function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const wasFocused = useRef(focused);

  useEffect(() => {
    const changed = wasFocused.current !== focused;
    wasFocused.current = focused;
    if (!changed || !focused || reduceMotion) return;
    scale.value = withSequence(withTiming(0.86, { duration: 70 }), withSpring(1, springs.reward));
  }, [focused, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

/**
 * Bottom bar in two parts: a pill holding the five destinations, evenly
 * spaced, and the Start button on its own beside it. Start is an action, not
 * a place, so it sits apart instead of splitting the tabs unevenly. A
 * highlight slides behind the active tab.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors, isDark, elevation } = useTheme();
  const reduceMotion = useReducedMotion();
  const [pillWidth, setPillWidth] = useState(0);

  const press = (routeKey: string, focused: boolean) => {
    const event = emitter.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigateToTab(routeKey);
  };

  const startRoute = state.routes.find((r) => r.name === 'start');
  const tabs = state.routes.filter((r) => r.name !== 'start');
  const activeKey = state.routes[state.index]?.key;
  const activeTab = Math.max(0, tabs.findIndex((r) => r.key === activeKey));
  const tabWidth = pillWidth > 0 ? (pillWidth - INSET * 2) / tabs.length : 0;

  const x = useSharedValue(0);
  const placed = useSharedValue(0);
  useEffect(() => {
    if (tabWidth === 0) return;
    const target = activeTab * tabWidth;
    if (placed.value === 0 || reduceMotion) {
      x.value = target;
      placed.value = 1;
    } else {
      x.value = withSpring(target, springs.slide);
    }
  }, [activeTab, tabWidth, reduceMotion, x, placed]);
  const highlightStyle = useAnimatedStyle(() => ({ opacity: placed.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[styles.pill, { backgroundColor: isDark ? colors.surface : colors.surface2 }]}
        onLayout={(e) => setPillWidth(e.nativeEvent.layout.width)}
        accessibilityRole="tablist"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            { width: tabWidth, backgroundColor: isDark ? colors.surface3 : colors.surface },
            elevation.card,
            highlightStyle,
          ]}
        />
        {tabs.map((route) => {
          const focused = route.key === activeKey;
          const { options } = descriptors[route.key]!;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const tint = focused ? colors.ink : colors.muted;
          return (
            <PressableScale
              key={route.key}
              onPress={() => press(route.key, focused)}
              scale={0.92}
              pressedOpacity={0.6}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.item}
            >
              <TabIcon focused={focused}>{options.tabBarIcon?.({ focused, color: tint, size: 22 })}</TabIcon>
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                style={[styles.label, { color: tint, fontFamily: focused ? fonts.bodyBold : fonts.bodyMedium }]}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {startRoute ? (
        <PressableScale
          onPress={() => press(startRoute.key, false)}
          scale={0.9}
          accessibilityRole="button"
          accessibilityLabel="Start a practice session"
          hitSlop={4}
          style={[styles.start, { backgroundColor: colors.accent }, !isDark && [styles.startLift, { shadowColor: colors.accent }]]}
        >
          <Icon name="play" size={22} color={colors.accentInk} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, paddingHorizontal: GUTTER },
  pill: { flex: 1, flexDirection: 'row', height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, padding: INSET },
  highlight: { position: 'absolute', left: INSET, top: INSET, bottom: INSET, borderRadius: (BAR_HEIGHT - INSET * 2) / 2 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10.5, letterSpacing: -0.1 },
  start: { width: BAR_HEIGHT, height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  startLift: { shadowOpacity: 0.34, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
});
