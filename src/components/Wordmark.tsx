import { StyleSheet, Text, View } from 'react-native';

import { fonts, useTheme } from '@/src/theme';

/** Logo tile and lowercase wordmark; `size` is the tile's edge. */
export function Wordmark({ size = 30 }: { size?: number }) {
  const { colors } = useTheme();
  const k = size / 30;
  return (
    <View style={[styles.row, { gap: 8 * k }]} accessibilityRole="header" accessibilityLabel="Larping">
      <View style={[styles.logo, { width: size, height: size, borderRadius: 9 * k, backgroundColor: colors.accent }]}>
        <Text style={[styles.logoText, { color: colors.accentInk, fontSize: 21 * k, lineHeight: 24 * k }]}>L</Text>
      </View>
      <Text style={[styles.word, { color: colors.ink, fontSize: 27 * k, lineHeight: 31 * k, letterSpacing: -1.1 * k }]}>larping</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  logo: { alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: fonts.numHeavy, marginTop: 1 },
  word: { fontFamily: fonts.displayHeavy },
});
