import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GUTTER, useTheme } from '@/src/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Fixed above the content (TopBar / NavBar). */
  header?: ReactNode;
  /** Pinned to the bottom, above the home indicator (primary CTA). */
  footer?: ReactNode;
  /** Horizontal page gutter on the content. */
  padded?: boolean;
  /** Tab screens skip the bottom inset: the tab bar already reserves it. */
  edges?: ('top' | 'bottom')[];
  stickyHeaderIndices?: number[];
};

/** App screen wrapper: themed background, safe areas, fixed header/footer slots. */
export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  header,
  footer,
  padded = true,
  edges = ['top', 'bottom'],
  stickyHeaderIndices,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const top = edges.includes('top') ? insets.top : 0;
  const bottom = edges.includes('bottom') ? insets.bottom : 0;
  const gutter = padded ? styles.gutter : null;

  const footerEl = footer ? (
    <View style={[styles.footer, { paddingBottom: bottom + 10, borderTopColor: colors.line, backgroundColor: colors.bg }]}>
      {footer}
    </View>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: top }, style]}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[gutter, { paddingTop: header ? 4 : 8, paddingBottom: footer ? 24 : bottom + 24 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={stickyHeaderIndices}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, gutter, { paddingTop: header ? 0 : 8, paddingBottom: footer ? 0 : bottom + 8 }, contentStyle]}>
          {children}
        </View>
      )}
      {footerEl}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  gutter: { paddingHorizontal: GUTTER },
  footer: { paddingHorizontal: GUTTER, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
