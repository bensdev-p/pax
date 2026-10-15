import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { FilterChip } from '@/components/FilterChip';
import { Header } from '@/components/Header';
import { ChevronIcon } from '@/components/Icons';
import { YoursBadge } from '@/components/PrayBits';
import { Card } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { SearchInput } from '@/components/SearchInput';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer } from '@/data/types';
import { asPrayer, YOURS } from '@/lib/myPrayers';
import { filterPrayers, PRAYER_SECTIONS } from '@/lib/pray';
import { useMyPrayers } from '@/state/myPrayers';

/**
 * The prayer book: one section at a time, or a search across all of them. The user's own
 * prayers sit in the section they chose, marked "Yours", and the last chip lists them all.
 */
export default function PrayersScreen() {
  const t = useTheme();
  const content = useContent();
  const [builtIn, setBuiltIn] = useState<Prayer[] | null>(null);
  const { prayers: mine } = useMyPrayers();
  const [query, setQuery] = useState('');
  const [section, setSection] = useState(PRAYER_SECTIONS[0]!.category);

  useEffect(() => {
    void content.prayers().then(setBuiltIn);
  }, [content]);

  const prayers = builtIn ? [...builtIn, ...mine.map(asPrayer)] : null;
  const sections = PRAYER_SECTIONS.filter((s) => prayers?.some((p) => p.category === s.category));
  // Back to the first section if the last of the user's prayers was deleted while "Yours" was open.
  const current = section === YOURS && !mine.length ? PRAYER_SECTIONS[0]!.category : section;
  const shown = filterPrayers(prayers ?? [], query, current);
  const searching = query.trim().length > 0;
  // The whole book, yours included.
  const count = builtIn ? `${builtIn.length + mine.length} prayers${mine.length ? ` · ${mine.length} yours` : ''}` : undefined;

  const add = () =>
    router.push({ pathname: '/my-prayer', params: { section: current === YOURS ? PRAYER_SECTIONS[1]!.category : current } });

  return (
    <Screen header={<Header title="Prayer book" subtitle={count} right={<AddButton onPress={add} />} />}>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Find a prayer" />

      {!searching ? (
        // Bleeds to the screen edges so chips scroll in from the side.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {sections.map((s) => (
            <FilterChip key={s.category} label={s.title} selected={s.category === current} onPress={() => setSection(s.category)} />
          ))}
          {mine.length ? <FilterChip label={`Yours · ${mine.length}`} selected={current === YOURS} onPress={() => setSection(YOURS)} /> : null}
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
          accessibilityLabel={p.mine ? `${p.title}, yours` : p.title}
          contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black', flexShrink: 1 }}>
                {p.title}
              </Text>
              {p.mine ? <YoursBadge /> : null}
            </View>
            {p.by ? (
              <Text variant="small" color={t.accent.text} style={{ fontFamily: 'Nunito_800ExtraBold' }} numberOfLines={1}>
                {p.by}
              </Text>
            ) : null}
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

function AddButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a prayer"
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 38,
        borderRadius: t.radius.tile,
        borderWidth: t.border.width,
        borderBottomWidth: pressed ? t.border.width : 4,
        marginTop: pressed ? 2 : 0,
        borderColor: t.accent.accent,
        backgroundColor: t.accent.tint,
      })}>
      <Text variant="label" caps color={t.accent.text} style={{ fontSize: 16, lineHeight: 18 }}>
        +
      </Text>
      <Text variant="label" caps color={t.accent.text}>
        Add
      </Text>
    </Pressable>
  );
}
