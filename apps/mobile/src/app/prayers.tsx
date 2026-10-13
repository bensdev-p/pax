import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Header } from '@/components/Header';
import { ChevronIcon, SearchIcon } from '@/components/Icons';
import { Card } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer } from '@/data/types';
import { filterPrayers, PRAYER_SECTIONS } from '@/lib/pray';

// The field already has a focus border; drop the browser's own outline on web.
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineWidth: 0 } as object) : null;

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
      <View
        style={{
          height: 50,
          borderWidth: t.border.width,
          borderColor: searching ? t.accent.accent : t.neutral.border,
          borderRadius: t.radius.tile,
          backgroundColor: t.neutral.surface,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <SearchIcon color={t.neutral.textSubtle} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find a prayer"
          placeholderTextColor={t.neutral.textSubtle}
          returnKeyType="search"
          accessibilityLabel="Find a prayer"
          style={[{ flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: t.neutral.text }, WEB_NO_OUTLINE]}
        />
      </View>

      {!searching ? (
        // Bleeds to the screen edges so chips scroll in from the side.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {sections.map((s) => {
            const on = s.category === section;
            return (
              <Pressable
                key={s.category}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setSection(s.category)}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  justifyContent: 'center',
                  borderRadius: t.radius.chip,
                  borderWidth: t.border.width,
                  borderColor: on ? t.accent.accent : t.neutral.border,
                  backgroundColor: on ? t.accent.tint : 'transparent',
                }}>
                <Text variant="small" style={{ fontFamily: 'Nunito_800ExtraBold' }} color={on ? t.accent.text : t.neutral.textMuted}>
                  {s.title}
                </Text>
              </Pressable>
            );
          })}
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
