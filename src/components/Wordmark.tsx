import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { fonts, useTheme } from '@/src/theme';

/** The Legit tier's gold, fixed so the mark looks the same in light and dark. */
const LEGIT_GOLD = '#FFC53D';
const LEGIT_INK = '#1B1505';

/** A masquerade mask with almond eye holes, drawn on a 24-unit grid. */
const MASK =
  'M2.2 9.2C2.2 6.9 4.6 5.8 7.6 5.8c2.2 0 3.3 1.1 4.4 1.1s2.2-1.1 4.4-1.1c3 0 5.4 1.1 5.4 3.4 0 4.6-2.5 8-5.6 8-2.3 0-3-2.6-4.2-2.6s-1.9 2.6-4.2 2.6c-3.1 0-5.6-3.4-5.6-8z' +
  'M5 10.3c.5-1.3 1.9-1.9 3.3-1.7 1.3.2 2.1 1 2.3 2.1-.9 1-2.2 1.4-3.5 1.1-1-.2-1.8-.8-2.1-1.5z' +
  'm14 0c-.5-1.3-1.9-1.9-3.3-1.7-1.3.2-2.1 1-2.3 2.1.9 1 2.2 1.4 3.5 1.1 1-.2 1.8-.8 2.1-1.5z';

/**
 * Logo mark: a mask on a sticker-tilted tile, with a gold verified tick stuck
 * to the corner. Larping is wearing the mask; the tick is the proof that
 * arrives once the practice is real. Larping to Legit, in one glyph.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  const { colors } = useTheme();
  const k = size / 30;
  const badge = 15 * k;
  const glyph = 24 * k;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: 9 * k, backgroundColor: colors.accent, transform: [{ rotate: '-7deg' }] },
        ]}
      >
        <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
          <Path d={MASK} fill={colors.accentInk} fillRule="evenodd" />
        </Svg>
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
  badge: { position: 'absolute' },
  word: { fontFamily: fonts.displayHeavy },
});
