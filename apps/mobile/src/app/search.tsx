import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { tidy } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { SearchIcon } from '@/components/Icons';
import { SectionLabel } from '@/components/LibraryBits';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { SearchHit, SearchKind } from '@/data/library';
import { openVerse } from '@/lib/libraryLinks';

// The field already has a focus border; drop the browser's own outline on web.
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineWidth: 0 } as object) : null;

const GROUPS: { kind: SearchKind; label: string }[] = [
  { kind: 'verse', label: 'Scripture' },
  { kind: 'ccc', label: 'Catechism' },
  { kind: 'father', label: 'Church Fathers' },
  { kind: 'prayer', label: 'Prayers' },
];

export default function SearchScreen() {
  const t = useTheme();
  const library = useLibrary();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void library.search(query).then((h) => !cancelled && setHits(h));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [library, query]);

  const open = async (hit: SearchHit) => {
    if (hit.kind === 'verse') openVerse(hit.key);
    else if (hit.kind === 'ccc') router.push({ pathname: '/ccc/[number]', params: { number: hit.key } });
    else if (hit.kind === 'prayer') router.push({ pathname: '/prayer/[slug]', params: { slug: hit.key } });
    else {
      router.push({ pathname: '/fathers/[author]', params: { author: hit.key.replace(/-[0-9a-f]{10}$/, ''), name: hit.title } });
    }
  };

  return (
    <Screen header={<Header title="Search" subtitle="Bible, Catechism, Fathers and prayers" />}>
      <View
        style={{
          height: 50,
          borderWidth: t.border.width,
          borderColor: t.accent.accent,
          borderRadius: t.radius.tile,
          backgroundColor: t.neutral.surface,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <SearchIcon color={t.neutral.textSubtle} />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="bread of life, shepherd, Mary…"
          placeholderTextColor={t.neutral.textSubtle}
          returnKeyType="search"
          accessibilityLabel="Search the library"
          style={[{ flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: t.neutral.text }, WEB_NO_OUTLINE]}
        />
      </View>

      {hits && hits.length === 0 ? (
        <Text variant="body" color={t.neutral.textMuted}>
          Nothing found for “{query}”.
        </Text>
      ) : null}

      {GROUPS.map(({ kind, label }) => {
        const group = hits?.filter((h) => h.kind === kind) ?? [];
        if (!group.length) return null;
        return (
          <View key={kind} style={{ gap: 2 }}>
            <SectionLabel>{label}</SectionLabel>
            {group.map((h) => (
              <Pressable
                key={`${h.kind}-${h.key}`}
                accessibilityRole="button"
                accessibilityLabel={h.title}
                onPress={() => void open(h)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  borderBottomWidth: t.border.width,
                  borderBottomColor: t.neutral.divider,
                  opacity: pressed ? 0.6 : 1,
                  gap: 2,
                })}>
                <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                  {h.title}
                </Text>
                <Text variant="small" color={t.neutral.textMuted} numberOfLines={3}>
                  {h.kind === 'ccc' ? h.snippet.split(' · ').map(tidy).join(' · ') : h.snippet}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
