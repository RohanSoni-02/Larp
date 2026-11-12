import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { fonts, useTheme } from '@/src/theme';

/** Docked tab bar with the purple Start button in the middle. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();

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
              <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Start a practice session"
                hitSlop={6}
                style={({ pressed }) => [
                  styles.start,
                  { backgroundColor: colors.accent, transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Icon name="play" size={18} color={colors.accentInk} />
              </Pressable>
            </View>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.6 : 1 }]}
          >
            {options.tabBarIcon?.({ focused, color: focused ? colors.ink : colors.subtle, size: 24 })}
            <Text
              style={[
                styles.label,
                { color: focused ? colors.ink : colors.subtle, fontFamily: focused ? fonts.bodyBold : fonts.bodyMedium },
              ]}
            >
              {label}
            </Text>
          </Pressable>
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
  start: { width: 52, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10.5, letterSpacing: -0.05 },
});
