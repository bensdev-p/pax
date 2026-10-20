import type { DaySnapshot } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useContent, useLibrary } from '@/data/content';
import { loadDailyWord, type DailyWordText } from '@/lib/dailyWordText';

import { QuoteIcon } from './Icons';
import { Card } from './Raised';
import { Text } from './Text';

interface Word extends DailyWordText {
  date: string;
}

/**
 * A short verse (not from the day's readings), or a line from a saint or Church Father, rotating
 * daily (decided with Ben for the space on Today). Quiet like the reading screens: serif text.
 * The Word for today widget shows the same word (widgets/widgetFeed.ts).
 */
export function WordForToday({ day }: { day: DaySnapshot }) {
  const t = useTheme();
  const content = useContent();
  const library = useLibrary();
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDailyWord(day, content, library).then((w) => {
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
