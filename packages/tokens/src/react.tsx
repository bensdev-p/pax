import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { resolveTheme, type Appearance, type PaletteName, type Theme } from './index';

const ThemeContext = createContext<Theme>(resolveTheme({ liturgicalColor: 'green' }));

export interface ThemeProviderProps {
  /** The day's liturgical color (DaySnapshot.color). */
  liturgicalColor: string;
  /** Lock a fixed palette instead of following the Church year. */
  lockedColor?: PaletteName | null;
  /** Light (default), dark, or follow the phone. */
  appearance?: Appearance;
  children: ReactNode;
}

/**
 * Maps the liturgical color to the accent palette. Only the accent changes with the
 * season; backgrounds and text stay neutral (SPEC: Liturgical theming, rule 2).
 */
export function ThemeProvider({
  liturgicalColor,
  lockedColor = null,
  appearance = 'light',
  children,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const theme = useMemo(
    () =>
      resolveTheme({
        liturgicalColor,
        lockedColor,
        appearance,
        systemScheme: systemScheme === 'dark' ? 'dark' : 'light',
      }),
    [liturgicalColor, lockedColor, appearance, systemScheme],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
