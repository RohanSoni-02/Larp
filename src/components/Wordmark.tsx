import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { fonts, useTheme } from '@/src/theme';

/** The Legit tier's gold, fixed so the mark looks the same in light and dark. */
const LEGIT_GOLD = '#FFC53D';
const LEGIT_INK = '#1B1505';

/**
 * Logo mark: a sticker-tilted "L" tile that has picked up a gold verified
 * tick. It is the app's ladder in one glyph, from Larping to Legit: you start
 * out pretending and the proof turns up in the corner.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  const { colors } = useTheme();
  const k = size / 30;
  const badge = 15 * k;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: 9 * k, backgroundColor: colors.accent, transform: [{ rotate: '-7deg' }] },
        ]}
      >
        <Text style={[styles.letter, { color: colors.accentInk, fontSize: 22 * k, lineHeight: 25 * k }]} allowFontScaling={false}>
          L
        </Text>
      </View>
      <View style={[styles.badge, { right: -5 * k, bottom: -4 * k }]}>
        <Svg width={badge} height={badge} viewBox="0 0 20 20">
          {/* ring in the page colour so the tick reads as stuck on top of the tile */}
          <Circle cx={10} cy={10} r={10} fill={colors.bg} />
          <Circle cx={10} cy={10} r={7.6} fill={LEGIT_GOLD} />
          <Path d="M6.4 10.3 L8.9 12.7 L13.7 7.6" stroke={LEGIT_INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </View>
    </View>
  );
}

/** Logo mark and lowercase wordmark; `size` is the mark's edge. */
export function Wordmark({ size = 30 }: { size?: number }) {
  const { colors } = useTheme();
  const k = size / 30;
  return (
    <View style={[styles.row, { gap: 11 * k }]} accessibilityRole="header" accessibilityLabel="Larping">
      <LogoMark size={size} />
      <Text style={[styles.word, { color: colors.ink, fontSize: 27 * k, lineHeight: 31 * k, letterSpacing: -1.1 * k }]}>larping</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  tile: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.numHeavy, marginTop: 1 },
  badge: { position: 'absolute' },
  word: { fontFamily: fonts.displayHeavy },
});
