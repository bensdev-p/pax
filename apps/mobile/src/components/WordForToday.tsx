import type { DaySnapshot } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useContent, useLibrary } from '@/data/content';
import { verseLabel } from '@/data/library';
import { excerptSource } from '@/lib/catena';
import { dailyWordFor, workTitle } from '@/lib/dailyWord';

import { QuoteIcon } from './Icons';
import { Card } from './Raised';
import { Text } from './Text';

interface Word {
  date: string;
  label: string;
  text: string;
  source: string;
  href: Href;
}

/**
 * A short verse (not from the day's readings), or a line from a saint or Church Father, rotating
 * daily (decided with Ben for the space on Today). Quiet like the reading screens: serif text.
 */
export function WordForToday({ day }: { day: DaySnapshot }) {
  const t = useTheme();
  const content = useContent();
  const library = useLibrary();
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pick = dailyWordFor(day);
    const load = async (): Promise<Omit<Word, 'date'> | null> => {
      if (pick.kind === 'verse') {
        const verses = (await library.passage(pick.citation)).flat();
        const first = verses[0];
        if (!first) return null;
        const last = verses.at(-1)!;
        const range = last.douay_verse !== first.douay_verse ? `–${last.douay_verse}` : '';
        return {
          label: 'A verse for today',
          text: verses.map((v) => v.text).join(' '),
          source: `${verseLabel(first)}${range} · Douay-Rheims`,
          href: { pathname: '/verse/[ref]', params: { ref: first.ref } },
        };
      }
      if (pick.kind === 'saint') {
        const saint = await content.saint(pick.key);
        if (!saint?.quote) return null;
        return {
          label: 'From the saints',
          text: saint.quote,
          source: [saint.name, saint.quote_source].filter(Boolean).join(' · '),
          href: { pathname: '/saint/[key]', params: { key: saint.romcal_key } },
        };
      }
      const excerpt = await library.fatherPassage(pick.slug);
      if (!excerpt) return null;
      const from = excerptSource(excerpt);
      return {
        label: 'From the Church Fathers',
        text: from.text.replace(/\s*\n\s*\n\s*/g, ' '),
        source: `${excerpt.author} · ${from.work ? workTitle(from.work) : `via ${from.via}`}`,
        href: { pathname: '/fathers/[author]', params: { author: excerpt.author_slug, name: excerpt.author } },
      };
    };
    void load().then((w) => {
      if (!cancelled) setWord(w ? { ...w, date: day.date } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [content, library, day]);

  if (!word || word.date !== day.date) return null;
  return (
    <Card onPress={() => router.push(word.href)} accessibilityLabel={`${word.label}: ${word.text}. ${word.source}`} contentStyle={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <QuoteIcon size={18} color={t.accent.accent} />
        <Text variant="label" caps color={t.accent.text}>
          {word.label}
        </Text>
      </View>
      <Text variant="scripture">{word.text}</Text>
      <Text variant="small" color={t.neutral.textMuted}>
        {word.source}
      </Text>
    </Card>
  );
}
