import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { fonts, useTheme } from '@/src/theme';
import { springs } from '@/src/theme/motion';

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

/** Docked tab bar with the purple Start button in the middle. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.bg, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const { options } = descriptors[route.key]!;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        if (route.name === 'start') {
          return (
            <View key={route.key} style={styles.item}>
              <PressableScale
                onPress={onPress}
                scale={0.92}
                accessibilityRole="button"
                accessibilityLabel="Start a practice session"
                hitSlop={6}
                style={[
                  styles.start,
                  { backgroundColor: colors.accent },
                  !isDark && [styles.startLift, { shadowColor: colors.accent }],
                ]}
              >
                <Icon name="play" size={19} color={colors.accentInk} />
              </PressableScale>
            </View>
          );
        }

        const tint = focused ? colors.ink : colors.subtle;
        return (
          <PressableScale
            key={route.key}
            onPress={onPress}
            scale={0.94}
            pressedOpacity={0.6}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.item}
          >
            <TabIcon focused={focused}>{options.tabBarIcon?.({ focused, color: tint, size: 24 })}</TabIcon>
            <Text style={[styles.label, { color: tint, fontFamily: focused ? fonts.bodyBold : fonts.bodyMedium }]}>{label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  start: { width: 54, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  startLift: { shadowOpacity: 0.32, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  label: { fontSize: 10.5, letterSpacing: -0.05 },
});
