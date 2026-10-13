import { useTheme } from '@pax/tokens/react';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { FatherExcerpt } from '@/data/library';
import { excerptSource } from '@/lib/catena';

import { Card } from './Raised';
import { Text } from './Text';

/**
 * A Father's excerpt, collapsed to a few lines until tapped. `byWork` is for a list that is
 * already one Father's: the work leads instead of his name.
 */
export function FatherCard({ excerpt, showRef, byWork }: { excerpt: FatherExcerpt; showRef?: string; byWork?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const lines = byWork ? 4 : 5;
  // Aquinas's Catena Aurea quotes are shown under the Father's own work (lib/catena.ts).
  const from = excerptSource(excerpt);
  const via = from.via ? `via ${from.via}` : null;
  // About how much fits in the collapsed lines; longer excerpts get a "Read more".
  const long = from.text.length > lines * 52;
  return (
    <Card onPress={() => setOpen(!open)} accessibilityLabel={`${excerpt.author}, ${excerpt.work}`} contentStyle={{ padding: 14, gap: 6 }}>
      {byWork ? (
        <View style={{ gap: 1 }}>
          <Text variant="label" caps color={t.neutral.textMuted} numberOfLines={open ? undefined : 1}>
            {from.work ?? via}
          </Text>
          {from.work && via ? (
            <Text variant="small" color={t.neutral.textSubtle} numberOfLines={1}>
              {via}
            </Text>
          ) : null}
        </View>
      ) : (
        <>
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
          <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
            {[showRef, from.work, via].filter(Boolean).join(' · ')}
          </Text>
        </>
      )}
      <Text variant="scripture" style={{ fontSize: 16, lineHeight: 24 }} numberOfLines={open ? undefined : lines}>
        {from.text}
      </Text>
      {byWork && long && !open ? (
        <Text variant="small" color={t.accent.text} style={{ fontFamily: 'Nunito_900Black' }}>
          Read more
        </Text>
      ) : null}
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
  if (!letters || letters !== letters.toUpperCase()) return heading;
  const small = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
  return heading
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\.?$/.test(word)) return word.toUpperCase();
      if (i > 0 && small.has(word)) return word;
      return word.replace(/^([("']?)([a-z])/, (_, p: string, c: string) => p + c.toUpperCase());
    })
    .join(' ');
}
