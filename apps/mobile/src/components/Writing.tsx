import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

import type { WritingChapter } from '@/data/types';

import { Text } from './Text';

/** One chapter of a Father's work: its number and the translation's heading, then the text. */
export function WritingChapterView({ chapter, highlight }: { chapter: WritingChapter; highlight?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        { gap: 6 },
        // A chapter opened from a link (a saint's quote) is tinted so it's easy to find.
        highlight ? { backgroundColor: t.accent.tint, borderRadius: t.radius.tile, padding: 12, marginHorizontal: -12 } : null,
      ]}>
      <View style={{ gap: 1 }}>
        <Text variant="label" caps color={t.accent.text}>
          {chapter.number === 0 ? 'Greeting' : `Chapter ${chapter.number}`}
        </Text>
        {chapter.number > 0 ? (
          <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
            {chapter.title}
          </Text>
        ) : null}
      </View>
      <Text variant="scripture" selectable>
        {chapter.text}
      </Text>
    </View>
  );
}
