import { useTheme } from '@pax/tokens/react';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { FatherExcerpt } from '@/data/library';

import { Card } from './Raised';
import { Text } from './Text';

/** A Father's excerpt, collapsed to a few lines until tapped. */
export function FatherCard({ excerpt, showRef }: { excerpt: FatherExcerpt; showRef?: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Card onPress={() => setOpen(!open)} accessibilityLabel={`${excerpt.author}, ${excerpt.work}`} contentStyle={{ padding: 14, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black', flex: 1 }}>
          {excerpt.author}
        </Text>
        {excerpt.year && excerpt.year < 9999 ? (
          <Text variant="small" color={t.neutral.textSubtle}>
            c. {excerpt.year}
          </Text>
        ) : null}
      </View>
      <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
        {showRef ? `${showRef} · ` : ''}
        {excerpt.work}
      </Text>
      <Text variant="scripture" style={{ fontSize: 16, lineHeight: 24 }} numberOfLines={open ? undefined : 5}>
        {excerpt.text}
      </Text>
      {open && excerpt.source_url ? (
        <Pressable accessibilityRole="link" onPress={() => void WebBrowser.openBrowserAsync(excerpt.source_url!)}>
          <Text variant="small" color={t.accent.text} style={{ textDecorationLine: 'underline' }}>
            Read the source
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

/** The scraped headings are upper case ("SECTION TWO I. THE CREEDS"); soften them for reading. */
export function tidy(heading: string): string {
  const letters = heading.replace(/[^A-Za-z]/g, '');
  if (letters && letters === letters.toUpperCase()) {
    return heading.toLowerCase().replace(/(^|[\s"'(:-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
  }
  return heading;
}
