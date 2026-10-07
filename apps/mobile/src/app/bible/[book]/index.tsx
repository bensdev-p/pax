import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { BibleBook } from '@/data/library';

export default function ChaptersScreen() {
  const t = useTheme();
  const { book: osis } = useLocalSearchParams<{ book: string }>();
  const library = useLibrary();
  const [book, setBook] = useState<BibleBook | null>(null);

  useEffect(() => {
    void library.book(String(osis)).then(setBook);
  }, [library, osis]);

  const chapters = Array.from({ length: book?.chapter_count ?? 0 }, (_, i) => i + 1);
  return (
    <Screen
      header={
        <Header
          title={book?.name_douay ?? ''}
          subtitle={book && book.name !== book.name_douay ? `${book.name} in modern Bibles` : `${book?.chapter_count ?? ''} chapters`}
        />
      }>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {chapters.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Chapter ${c}`}
            onPress={() => router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(osis), chapter: String(c) } })}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: t.radius.tile,
              borderWidth: t.border.width,
              borderColor: t.neutral.border,
              borderBottomWidth: pressed ? t.border.width : t.edge.card,
              marginTop: pressed ? 2 : 0,
              backgroundColor: t.neutral.surface,
              alignItems: 'center',
              justifyContent: 'center',
            })}>
            <Text variant="title" style={{ fontSize: 18 }}>
              {c}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
