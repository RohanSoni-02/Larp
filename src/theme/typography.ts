import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import type { TextStyle } from 'react-native';

export const fonts = {
  /** Bricolage Grotesque carries titles and section heads; Inter carries the UI. */
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  displayMedium: 'Inter_600SemiBold',
  black: 'Inter_900Black',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Condensed numerals for stats, timers, ranks and XP. */
  num: 'BarlowCondensed_700Bold',
  numHeavy: 'BarlowCondensed_800ExtraBold',
  numMedium: 'BarlowCondensed_600SemiBold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/**
 * Type scale. Display sizes are Bricolage with tight tracking; text sizes
 * are Inter with slight negative tracking.
 */
export const typography = {
  largeTitle: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, letterSpacing: -1.1 },
  title1: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 30, letterSpacing: -0.8 },
  title2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 25, letterSpacing: -0.55 },
  title3: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
  headline: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, letterSpacing: -0.15 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  callout: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, letterSpacing: -0.05 },
  subhead: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  footnote: { fontFamily: fonts.body, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 15 },
  micro: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 13, letterSpacing: 0.1 },
  stat: { fontFamily: fonts.num, fontSize: 24, lineHeight: 27, letterSpacing: 0, fontVariant: tabular },
  statLarge: { fontFamily: fonts.numHeavy, fontSize: 40, lineHeight: 42, letterSpacing: -0.5, fontVariant: tabular },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 11.5, lineHeight: 14 },
} satisfies Record<string, TextStyle>;

/** Load every app font at once; returns [loaded, error]. */
export function useAppFonts(): [boolean, Error | null] {
  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  return [loaded, error];
}
