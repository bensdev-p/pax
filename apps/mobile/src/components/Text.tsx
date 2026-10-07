import { useTheme } from '@pax/tokens/react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

/** Loaded font family per weight (React Native picks the face by name, not by fontWeight). */
export const FONTS = {
  700: 'Nunito_700Bold',
  800: 'Nunito_800ExtraBold',
  900: 'Nunito_900Black',
  serif: 'SourceSerif4_400Regular',
  serifSemiBold: 'SourceSerif4_600SemiBold',
} as const;

type Variant =
  | 'hero'
  | 'display'
  | 'headline'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'label'
  | 'button'
  | 'scripture';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  /** Uppercase with letter spacing, as the canvas does for labels and buttons. */
  caps?: boolean;
  align?: TextStyle['textAlign'];
}

export function Text({ variant = 'body', color, caps, align, style, ...rest }: TextProps) {
  const t = useTheme();
  const s = t.font.size;
  const variants: Record<Variant, TextStyle> = {
    hero: { fontFamily: FONTS[900], fontSize: s.hero, lineHeight: s.hero * 1.15 },
    display: { fontFamily: FONTS[900], fontSize: s.display, lineHeight: s.display * 1.2 },
    headline: { fontFamily: FONTS[900], fontSize: s.headline, lineHeight: s.headline * 1.2 },
    title: { fontFamily: FONTS[900], fontSize: s.title, lineHeight: s.title * 1.15 },
    body: { fontFamily: FONTS[700], fontSize: s.body, lineHeight: s.body * 1.35 },
    bodyStrong: { fontFamily: FONTS[800], fontSize: s.bodyLarge, lineHeight: s.bodyLarge * 1.35 },
    small: { fontFamily: FONTS[700], fontSize: s.small, lineHeight: s.small * 1.35 },
    label: { fontFamily: FONTS[900], fontSize: s.label, lineHeight: s.label * 1.3 },
    button: { fontFamily: FONTS[900], fontSize: s.button, lineHeight: s.button * 1.2 },
    scripture: { fontFamily: FONTS.serif, fontSize: s.scripture, lineHeight: s.scripture * 1.5 },
  };
  const base = variants[variant];
  const spacing = caps
    ? { letterSpacing: (base.fontSize ?? 14) * t.font.letterSpacing.label, textTransform: 'uppercase' as const }
    : null;
  return (
    <RNText
      {...rest}
      style={[{ color: color ?? t.neutral.text }, base, spacing, align ? { textAlign: align } : null, style]}
    />
  );
}
