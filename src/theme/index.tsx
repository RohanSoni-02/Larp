import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { light, dark, type ThemeColors } from './colors';
import { elevationFor, type Elevation } from './elevation';

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  elevation: Elevation;
};

const ThemeContext = createContext<Theme>({ colors: light, isDark: false, elevation: elevationFor(false) });

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <ThemeContext.Provider value={{ colors: isDark ? dark : light, isDark, elevation: elevationFor(isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Horizontal page gutter shared by every screen. */
export const GUTTER = 16;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export { storyRing, tierMetal } from './colors';
export { fonts, typography, useAppFonts } from './typography';
export { durations, easings, springs } from './motion';
