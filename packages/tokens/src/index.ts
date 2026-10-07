import { tokens } from './generated/theme';

export { tokens };
export { mix, withAlpha } from './color';

export type ColorScheme = 'light' | 'dark';
/** The user's appearance setting. Light is the default (the design canvases are light). */
export type Appearance = 'light' | 'dark' | 'system';
export type PaletteName = keyof typeof tokens.palettes;
export const PALETTE_NAMES = Object.keys(tokens.palettes) as PaletteName[];

export interface AccentPalette {
  /** Fill for chips, banners, path nodes, progress and the active tab. */
  accent: string;
  /** Raised bottom edge under accent fills (accent × 0.76). */
  edge: string;
  /** Text and icons drawn on the accent. */
  onAccent: string;
  /** Light wash for selected rows and the active tab box. */
  tint: string;
  /** Accent-colored text on the normal background. */
  text: string;
}

export interface Theme {
  scheme: ColorScheme;
  /** The palette actually shown (the day's color, or the locked one). */
  palette: PaletteName;
  /** True when the user locked a fixed theme instead of following the Church year. */
  locked: boolean;
  accent: AccentPalette;
  neutral: (typeof tokens.neutral)[ColorScheme];
  game: typeof tokens.game;
  pax: typeof tokens.pax;
  font: typeof tokens.font;
  radius: typeof tokens.radius;
  border: typeof tokens.border;
  edge: typeof tokens.edge;
  space: typeof tokens.space;
  size: typeof tokens.size;
}

export interface ThemeInput {
  /** The day's liturgical color from the DaySnapshot. */
  liturgicalColor: string;
  /** A fixed palette chosen in settings, or null to follow the Church year. */
  lockedColor?: PaletteName | null;
  appearance?: Appearance;
  /** The phone's color scheme, used when appearance is "system". */
  systemScheme?: ColorScheme | null;
}

export function isPaletteName(value: unknown): value is PaletteName {
  return typeof value === 'string' && value in tokens.palettes;
}

export function resolveScheme(appearance: Appearance, systemScheme?: ColorScheme | null): ColorScheme {
  if (appearance === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return appearance;
}

/** Maps the liturgical color (or a locked palette) and appearance to a full theme. */
export function resolveTheme(input: ThemeInput): Theme {
  const scheme = resolveScheme(input.appearance ?? 'light', input.systemScheme);
  const locked = !!input.lockedColor;
  const palette: PaletteName = input.lockedColor
    ? input.lockedColor
    : isPaletteName(input.liturgicalColor)
      ? input.liturgicalColor
      : 'green';
  return {
    scheme,
    palette,
    locked,
    accent: tokens.palettes[palette][scheme],
    neutral: tokens.neutral[scheme],
    game: tokens.game,
    pax: tokens.pax,
    font: tokens.font,
    radius: tokens.radius,
    border: tokens.border,
    edge: tokens.edge,
    space: tokens.space,
    size: tokens.size,
  };
}

export function paletteLabel(name: PaletteName): string {
  return tokens.palettes[name].label;
}
