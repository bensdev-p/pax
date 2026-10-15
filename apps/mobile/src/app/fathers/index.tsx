import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { FatherRow, FatherTile, pairs } from '@/components/FatherBits';
import { FilterChip } from '@/components/FilterChip';
import { Header } from '@/components/Header';
import { DownloadIcon } from '@/components/Icons';
import { SectionLabel } from '@/components/LibraryBits';
import { RaisedButton, RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { SearchInput } from '@/components/SearchInput';
import { Text } from '@/components/Text';
import { useFathersPack, useLibrary } from '@/data/content';
import { PACK_SUPPORTED } from '@/data/fathersPack';
import type { FatherAuthor } from '@/data/library';
import { FATHER_ERAS, fathersInEra, mostQuoted, searchFathers, type EraKey } from '@/lib/fathers';
import { useTapTwice } from '@/lib/useTapTwice';

const openFather = (a: FatherAuthor) => router.push({ pathname: '/fathers/[author]', params: { author: a.slug, name: a.name } });

/** The Church Fathers as a directory: search, the most quoted, then one era at a time. */
export default function FathersScreen() {
  const t = useTheme();
  const library = useLibrary();
  const pack = useFathersPack();
  const [authors, setAuthors] = useState<FatherAuthor[]>([]);
  const [query, setQuery] = useState('');
  const [era, setEra] = useState<EraKey>('early');

  useEffect(() => {
    void library.fatherAuthors().then(setAuthors);
  }, [library]);

  const searching = query.trim().length > 0;
  const found = searchFathers(authors, query);
  const excerpts = authors.reduce((n, a) => n + a.excerpts, 0);

  return (
    <Screen header={<Header title="Church Fathers" subtitle="From the Apostolic Fathers to St Thomas Aquinas" />}>
      <PackCard pack={pack} excerpts={excerpts} />

      <SearchInput value={query} onChangeText={setQuery} placeholder="Find a Father" />

      {searching ? (
        <View>
          {found.length === 0 ? (
            <Text variant="body" color={t.neutral.textMuted}>
              No Father matches “{query.trim()}”.
            </Text>
          ) : (
            found.map((a) => <FatherRow key={a.slug} author={a} onPress={() => openFather(a)} />)
          )}
        </View>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            <Text variant="title">Most quoted</Text>
            {pairs(mostQuoted(authors)).map(([a, b]) => (
              <View key={a.slug} style={{ flexDirection: 'row', gap: 12 }}>
                <FatherTile author={a} onPress={() => openFather(a)} />
                {b ? <FatherTile author={b} onPress={() => openFather(b)} /> : <View style={{ flex: 1 }} />}
              </View>
            ))}
          </View>

          <View style={{ gap: 6 }}>
            {/* Bleeds to the screen edges so chips scroll in from the side. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {FATHER_ERAS.map((e) => (
                <FilterChip key={e.key} label={e.label} selected={e.key === era} onPress={() => setEra(e.key)} />
              ))}
            </ScrollView>
            <SectionLabel>{FATHER_ERAS.find((e) => e.key === era)!.span}</SectionLabel>
            <View>
              {fathersInEra(authors, era).map((a) => (
                <FatherRow key={a.slug} author={a} onPress={() => openFather(a)} />
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

/** The full library: one line once installed, a short offer before. */
function PackCard({ pack, excerpts }: { pack: ReturnType<typeof useFathersPack>; excerpts: number }) {
  const t = useTheme();
  // Removing it means downloading it all again, so it takes a second tap.
  const removing = useTapTwice(() => void pack.remove());
  if (!PACK_SUPPORTED) {
    return (
      <Text variant="small" color={t.neutral.textMuted}>
        The web shows the starter set. The full library is a download in the phone app.
      </Text>
    );
  }
  if (pack.status === 'ready') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: t.radius.tile,
          borderWidth: t.border.width,
          borderColor: t.neutral.border,
        }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent.accent }} />
        <Text variant="small" style={{ flex: 1, fontFamily: 'Nunito_800ExtraBold' }}>
          Full library installed{excerpts ? ` · ${excerpts.toLocaleString('en-US')} excerpts` : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removing.armed ? 'Tap again to remove the download' : 'Remove the download'}
          hitSlop={8}
          onPress={removing.press}
          // Armed: a red pill, like the red buttons elsewhere that wait for a second tap.
          style={{ borderRadius: t.radius.chip, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: removing.armed ? t.game.incorrect : 'transparent' }}>
          <Text variant="label" caps color={removing.armed ? '#FFFFFF' : t.neutral.textMuted}>
            {removing.armed ? 'Tap again to remove' : 'Remove'}
          </Text>
        </Pressable>
      </View>
    );
  }
  const mb = Math.round((pack.totalBytes || 122_000_000) / 1_000_000);
  return (
    <RaisedSurface color={t.accent.accent} edgeColor={t.accent.edge} edge={t.edge.hero} radius={t.radius.panel} contentStyle={{ padding: 14, gap: 8 }}>
      <Text variant="label" caps color={t.accent.onAccent}>
        Starter set{excerpts ? ` · ${excerpts.toLocaleString('en-US')} excerpts` : ''}
      </Text>
      <Text variant="body" color={t.accent.onAccent}>
        Get the full library: about 70,000 excerpts on the whole Bible. A one-time {mb} MB download (Wi-Fi recommended), then it works offline.
      </Text>
      {pack.status === 'downloading' ? (
        <View style={{ gap: 6 }}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: withAlpha(t.accent.onAccent, 0.3) }}>
            <View style={{ width: `${Math.round(pack.progress * 100)}%`, height: 10, borderRadius: 5, backgroundColor: t.accent.onAccent }} />
          </View>
          <Text variant="small" color={t.accent.onAccent}>
            Downloading… {Math.round(pack.progress * 100)}%
          </Text>
        </View>
      ) : (
        <RaisedButton
          kind="white"
          height={44}
          label={pack.status === 'error' ? 'Try again' : 'Download'}
          icon={<DownloadIcon color={t.accent.edge} />}
          onPress={() => void pack.download()}
        />
      )}
      {pack.error ? (
        <Text variant="small" color={t.accent.onAccent}>
          {pack.error}
        </Text>
      ) : null}
    </RaisedSurface>
  );
}
