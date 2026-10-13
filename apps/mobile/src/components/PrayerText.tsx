import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

import { prayerStanzas } from '@/lib/prayerText';

import { Text } from './Text';

/**
 * A prayer in sense lines, as a prayer book prints it: a gap between stanzas, a little air
 * between lines so a new line reads apart from a wrapped one, and "V." and "R." in the accent.
 */
export function PrayerText({ text, selectable }: { text: string; selectable?: boolean }) {
  const t = useTheme();
  const lineHeight = t.font.size.scripture * 1.5;
  return (
    <View style={{ gap: 16 }}>
      {prayerStanzas(text).map((stanza, i) => (
        <View key={i} style={{ gap: 6 }}>
          {stanza.map((line, j) => (
            <Text key={j} variant="scripture" selectable={selectable}>
              {line.marker ? (
                // Nested text keeps the line's height (iOS sizes the line by its first span).
                <Text variant="label" color={t.accent.text} style={{ fontSize: 15, lineHeight }}>
                  {`${line.marker}  `}
                </Text>
              ) : null}
              {line.text}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
