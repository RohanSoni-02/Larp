import type { ViewStyle } from 'react-native';

export type Elevation = { card: ViewStyle; raised: ViewStyle; float: ViewStyle };

/**
 * Depth is used sparingly: hairlines do most of the separating. Dark mode
 * relies on surface steps instead of shadows, which vanish on black.
 */
export function elevationFor(isDark: boolean): Elevation {
  if (isDark) return { card: {}, raised: {}, float: {} };
  return {
    card: {
      shadowColor: '#1B1F3B',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    raised: {
      shadowColor: '#1B1F3B',
      shadowOpacity: 0.09,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    float: {
      shadowColor: '#1B1F3B',
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  };
}
