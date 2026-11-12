import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/src/components/IconButton';
import { fonts, useTheme } from '@/src/theme';
import { durations, easings, springs } from '@/src/theme/motion';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Bottom sheet used for comments, node details, pickers. The backdrop fades
 * while the panel rises on its own curve, and leaving is quicker than arriving.
 */
export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const { colors, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  // Mount as soon as it is asked for; unmount only once the exit has played.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      progress.value = reduceMotion ? withTiming(1, { duration: durations.base }) : withSpring(1, springs.sheet);
    } else {
      progress.value = withTiming(0, { duration: durations.base, easing: easings.inOut }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress, reduceMotion]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value) }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? progress.value : 1,
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.value) * windowHeight * 0.9 }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]} />
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close sheet" />
      <Animated.View
        style={[styles.panel, elevation.float, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 14 }, panelStyle]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.surface3 }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
            {title}
          </Text>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Close" variant="tonal" size={16} />
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={[styles.footer, { borderTopColor: colors.line }]}>{footer}</View> : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 19, letterSpacing: -0.4 },
  body: { flexShrink: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 10 },
});
