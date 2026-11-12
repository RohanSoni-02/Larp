import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/src/components/IconButton';
import { fonts, useTheme } from '@/src/theme';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Bottom sheet used for comments, node details, pickers. */
export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Close sheet" />
      <View style={[styles.panel, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 14 }]}>
        <View style={[styles.grabber, { backgroundColor: colors.surface3 }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Close" variant="tonal" size={16} />
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={[styles.footer, { borderTopColor: colors.line }]}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.35 },
  body: { flexShrink: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 10 },
});
