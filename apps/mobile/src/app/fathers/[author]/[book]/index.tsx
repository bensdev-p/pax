import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import { chaptersOf, shade } from '@/lib/fathers';

const GAP = 8;

/** The chapters of one book a Father comments on, shaded by how much he says on each. */
export default function FatherBookScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { author, book } = useLocalSearchParams<{ author: string; book: string }>();
  const library = useLibrary();
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState<{ chapter: number; count: number }[] | null>(null);

  useEffect(() => {
    void (async () => {
      const [a, b, refs, places] = await Promise.all([
        library.fatherAuthor(String(author)),
        library.book(String(book)),
        library.fatherRefs(String(author), String(book)),
        library.douayPlaces(String(book)),
      ]);
      setTitle(`${a?.name ?? ''} on ${b?.name_douay ?? book}`);
      setChapters(chaptersOf(refs, places));
    })();
  }, [library, author, book]);

  const list = chapters ?? [];
  const total = list.reduce((n, c) => n + c.count, 0);
  const counts = list.map((c) => c.count);
  const cols = list.length > 40 ? 6 : 5;
  const cell = Math.floor((Math.min(width, 640) - 32 - GAP * (cols - 1)) / cols);
  const fill = (level: 1 | 2 | 3) => withAlpha(t.accent.accent, t.scheme === 'dark' ? [0.16, 0.32, 0.5][level - 1]! : [0.08, 0.2, 0.36][level - 1]!);

  return (
    <Screen header={<Header title={title || ' '} subtitle={chapters ? `${total.toLocaleString('en-US')} ${total === 1 ? 'excerpt' : 'excerpts'}` : undefined} />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {list.map((c) => {
          const level = shade(c.count, counts);
          return (
            <Pressable
              key={c.chapter}
              accessibilityRole="button"
              accessibilityLabel={`Chapter ${c.chapter}, ${c.count} ${c.count === 1 ? 'excerpt' : 'excerpts'}`}
              onPress={() => router.push({ pathname: '/fathers/[author]/[book]/[chapter]', params: { author: String(author), book: String(book), chapter: String(c.chapter) } })}
              style={({ pressed }) => ({
                width: cell,
                height: cell,
                borderRadius: t.radius.tile,
                borderWidth: t.border.width,
                borderColor: level === 3 ? t.accent.accent : t.neutral.border,
                backgroundColor: fill(level),
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text variant="title" style={{ fontSize: 18 }}>
                {c.chapter}
              </Text>
              <Text variant="small" color={t.neutral.textMuted} style={{ fontSize: 11, lineHeight: 13, fontVariant: ['tabular-nums'] }}>
                {c.count}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {list.length > 1 ? (
        <Text variant="small" color={t.neutral.textMuted}>
          Darker chapters have more excerpts. Chapter numbers follow the Douay-Rheims.
        </Text>
      ) : null}
    </Screen>
  );
}
