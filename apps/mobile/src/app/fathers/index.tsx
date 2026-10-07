import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DownloadIcon } from '@/components/Icons';
import { Header } from '@/components/Header';
import { ListRow, SectionLabel } from '@/components/LibraryBits';
import { RaisedButton, RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useFathersPack, useLibrary } from '@/data/content';
import { PACK_SUPPORTED } from '@/data/fathersPack';
import type { FatherAuthor } from '@/data/library';

const ERAS: { label: string; until: number }[] = [
  { label: 'Before Nicaea (to 325)', until: 325 },
  { label: 'The great Fathers (325–749)', until: 749 },
  { label: 'Medieval Doctors (750–1300)', until: 1300 },
];

export default function FathersScreen() {
  const t = useTheme();
  const library = useLibrary();
  const pack = useFathersPack();
  const [authors, setAuthors] = useState<FatherAuthor[]>([]);

  useEffect(() => {
    void library.fatherAuthors().then(setAuthors);
  }, [library]);

  const grouped = useMemo(() => {
    let from = -Infinity;
    return ERAS.map((era) => {
      const list = authors.filter((a) => (a.year ?? 9999) > from && (a.year ?? 9999) <= era.until);
      from = era.until;
      return { ...era, list };
    }).filter((g) => g.list.length);
  }, [authors]);

  const mb = Math.round((pack.totalBytes || 122_000_000) / 1_000_000);

  return (
    <Screen header={<Header title="Church Fathers" subtitle="From the Apostolic Fathers to St Bonaventure" />}>
      {PACK_SUPPORTED ? (
        <RaisedSurface color={t.accent.accent} edgeColor={t.accent.edge} edge={t.edge.hero} radius={t.radius.panel} contentStyle={{ padding: 16, gap: 8 }}>
          <Text variant="label" caps color={t.accent.onAccent}>
            {pack.status === 'ready' ? 'Full library installed' : 'Starter set'}
          </Text>
          <Text variant="headline" color={t.accent.onAccent}>
            {pack.status === 'ready' ? 'About 70,000 excerpts, offline' : 'Get the full Fathers library'}
          </Text>
          <Text variant="body" color={t.accent.onAccent}>
            {pack.status === 'ready'
              ? 'Every verse shows everything the Fathers and Doctors said about it.'
              : `Pax ships with a few excerpts on each verse of the Gospels and Psalms. The full library covers the whole Bible: a one-time ${mb} MB download, then it works offline. Wi-Fi recommended.`}
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
          ) : pack.status === 'ready' ? (
            <RaisedButton kind="white" height={46} label="Remove download" onPress={() => void pack.remove()} />
          ) : (
            <RaisedButton
              kind="white"
              height={50}
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
      ) : (
        <Text variant="small" color={t.neutral.textMuted}>
          The web shows the starter set. The full library is a download in the phone app.
        </Text>
      )}

      {grouped.map((g) => (
        <View key={g.label} style={{ gap: 2 }}>
          <SectionLabel>{g.label}</SectionLabel>
          {g.list.map((a) => (
            <ListRow
              key={a.slug}
              title={a.name}
              subtitle={a.year && a.year < 9999 ? `Died c. ${a.year}` : undefined}
              right={a.excerpts.toLocaleString('en-US')}
              onPress={() => router.push({ pathname: '/fathers/[author]', params: { author: a.slug, name: a.name } })}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
