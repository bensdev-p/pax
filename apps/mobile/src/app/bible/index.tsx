import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { ListRow, SectionLabel } from '@/components/LibraryBits';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { BibleBook } from '@/data/library';

export default function BooksScreen() {
  const t = useTheme();
  const library = useLibrary();
  const [books, setBooks] = useState<BibleBook[]>([]);
  useEffect(() => {
    void library.books().then(setBooks);
  }, [library]);

  const section = (testament: 'OT' | 'NT', label: string) => (
    <View style={{ gap: 2 }}>
      <SectionLabel>{label}</SectionLabel>
      {books
        .filter((b) => b.testament === testament)
        .map((b) => (
          <ListRow
            key={b.osis}
            title={b.name_douay}
            subtitle={b.name !== b.name_douay ? `${b.name} in modern Bibles` : undefined}
            right={`${b.chapter_count}`}
            onPress={() => router.push({ pathname: '/bible/[book]', params: { book: b.osis } })}
          />
        ))}
    </View>
  );

  return (
    <Screen header={<Header title="Holy Bible" subtitle="Douay-Rheims, Challoner revision" />}>
      <Text variant="small" color={t.neutral.textMuted}>
        The Douay-Rheims keeps the traditional Catholic book names. Psalms follow the Latin Vulgate,
        so most are one number lower than in modern Bibles.
      </Text>
      {section('OT', 'Old Testament · 46 books')}
      {section('NT', 'New Testament · 27 books')}
    </Screen>
  );
}
