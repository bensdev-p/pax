import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FilterChip } from '@/components/FilterChip';
import { Header } from '@/components/Header';
import { ChevronIcon } from '@/components/Icons';
import { Card } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { SearchInput } from '@/components/SearchInput';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer } from '@/data/types';
import { filterPrayers, PRAYER_SECTIONS } from '@/lib/pray';

/** The prayer book: one section at a time, or a search across all of them. */
export default function PrayersScreen() {
  const t = useTheme();
  const content = useContent();
  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState(PRAYER_SECTIONS[0]!.category);

  useEffect(() => {
    void content.prayers().then(setPrayers);
  }, [content]);

  const sections = PRAYER_SECTIONS.filter((s) => prayers?.some((p) => p.category === s.category));
  const shown = filterPrayers(prayers ?? [], query, section);
  const searching = query.trim().length > 0;

  return (
    <Screen header={<Header title="Prayer book" subtitle={prayers ? `${prayers.length} prayers` : undefined} />}>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Find a prayer" />

      {!searching ? (
        // Bleeds to the screen edges so chips scroll in from the side.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {sections.map((s) => (
            <FilterChip key={s.category} label={s.title} selected={s.category === section} onPress={() => setSection(s.category)} />
          ))}
        </ScrollView>
      ) : null}

      {searching && prayers && shown.length === 0 ? (
        <Text variant="body" color={t.neutral.textMuted}>
          No prayer matches “{query.trim()}”.
        </Text>
      ) : null}

      {shown.map((p) => (
        <Card
          key={p.slug}
          onPress={() => router.push({ pathname: '/prayer/[slug]', params: { slug: p.slug } })}
          accessibilityLabel={p.title}
          contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
              {p.title}
            </Text>
            <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
              {p.text.replace(/\n+/g, ' ')}
            </Text>
          </View>
          <ChevronIcon color={t.neutral.textSubtle} />
        </Card>
      ))}
    </Screen>
  );
}
