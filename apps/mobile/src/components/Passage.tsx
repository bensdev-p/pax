import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

import { Text } from './Text';

export interface PassageVerse {
  ref: string;
  douay_verse: number;
  text: string;
}

/**
 * Bible text as one flowing paragraph with small verse numbers. The numbers keep the
 * paragraph's line height: iOS lays out the whole paragraph with the first span's.
 */
export function Passage({ verses, heading }: { verses: PassageVerse[]; heading?: string }) {
  const t = useTheme();
  if (!verses.length) return null;
  return (
    <View style={{ gap: 4 }}>
      {heading ? (
        <Text variant="label" caps color={t.neutral.textMuted}>
          {heading}
        </Text>
      ) : null}
      <Text variant="scripture" selectable>
        {verses.map((v, j) => (
          <Text key={v.ref} variant="scripture">
            {j > 0 ? ' ' : ''}
            <Text variant="label" color={t.accent.text} style={{ fontSize: 12, lineHeight: t.font.size.scripture * 1.5 }}>
              {v.douay_verse}
              {' '}
            </Text>
            {v.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}
