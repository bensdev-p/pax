import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BookIcon, SaintIcon, ScrollIcon } from '@/components/Icons';
import { Chip, SearchField, ShelfTile } from '@/components/LibraryBits';
import { RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { ChapterView } from '@/data/library';
import { citationRefs, openChapter, openCitation, openVerse } from '@/lib/libraryLinks';
import { useAppState } from '@/state/AppState';

interface FeastChip {
  label: string;
  onPress: () => void;
}

export default function LibraryScreen() {
  const t = useTheme();
  const library = useLibrary();
  const { today, settings } = useAppState();
  const [stats, setStats] = useState<{ verses: number; ccc: number; fathers: number; fullFathers: boolean } | null>(null);
  const [reading, setReading] = useState<ChapterView | null>(null);
  const [chips, setChips] = useState<FeastChip[]>([]);

  const position = settings.lastRead ?? { book: 'John', chapter: 1 };

  useEffect(() => {
    void library.stats().then(setStats);
    void library.chapter(position.book, position.chapter).then(setReading);
  }, [library, position.book, position.chapter]);

  // "For today's feast": the Gospel, a Catechism paragraph and a Father on it.
  useEffect(() => {
    const gospel = today?.readings?.gospel;
    if (!gospel) return;
    let cancelled = false;
    (async () => {
      const out: FeastChip[] = [{ label: gospel, onPress: () => void openCitation(library, gospel) }];
      const refs = citationRefs(gospel);
      for (const ref of refs) {
        const ccc = await library.cccForVerse(ref);
        if (ccc[0]) {
          const n = ccc[0].number;
          out.push({ label: `CCC ${n}`, onPress: () => router.push({ pathname: '/ccc/[number]', params: { number: String(n) } }) });
          break;
        }
      }
      for (const ref of refs) {
        const fathers = await library.fathersForVerse(ref);
        if (fathers[0]) {
          out.push({ label: fathers[0].author, onPress: () => openVerse(ref) });
          break;
        }
      }
      if (!cancelled) setChips(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [library, today?.readings?.gospel]);

  const firstVerse = reading?.verses[0]?.text ?? '';
  const progress = reading ? reading.chapter / reading.book.chapter_count : 0;

  return (
    <Screen>
      <Text variant="hero" style={{ fontSize: 28 }} accessibilityRole="header">
        Library
      </Text>
      <SearchField placeholder="Search Bible, Catechism, Fathers…" onPress={() => router.push('/search')} />

      <RaisedSurface
        color={t.accent.accent}
        edgeColor={t.accent.edge}
        edge={t.edge.hero}
        radius={t.radius.panel}
        onPress={() => openChapter(position.book, position.chapter)}
        accessibilityLabel="Continue reading"
        contentStyle={{ padding: 16, gap: 6 }}>
        <Text variant="label" caps color={t.accent.onAccent}>
          {settings.lastRead ? 'Continue reading' : 'Start reading'}
        </Text>
        <Text variant="headline" color={t.accent.onAccent}>
          {reading ? `${reading.book.name_douay} ${reading.chapter}` : ' '}
          {reading?.incipit ? ` · ${reading.incipit.replace(/\.$/, '')}` : ''}
        </Text>
        <Text variant="scripture" color={t.accent.onAccent} numberOfLines={2} style={{ fontSize: 16, lineHeight: 23 }}>
          {firstVerse ? `“${firstVerse}”` : ''}
        </Text>
        <View style={{ marginTop: 4, height: 8, borderRadius: 4, backgroundColor: withAlpha(t.accent.onAccent, 0.3) }}>
          <View style={{ width: `${Math.round(progress * 100)}%`, height: 8, borderRadius: 4, backgroundColor: t.accent.onAccent }} />
        </View>
      </RaisedSurface>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShelfTile
          title="Bible"
          subtitle="Douay-Rheims · 73 books"
          tint="#FF6B6B"
          icon={<BookIcon size={28} />}
          onPress={() => router.push('/bible')}
        />
        <ShelfTile
          title="Catechism"
          subtitle={stats ? `${stats.ccc.toLocaleString('en-US')} paragraphs` : ' '}
          tint="#2FA4E7"
          icon={
            <Text variant="small" color={t.scheme === 'dark' ? '#7CC6F2' : '#1E78B0'} style={{ fontFamily: 'Nunito_900Black' }}>
              CCC
            </Text>
          }
          onPress={() => router.push('/ccc')}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShelfTile
          title="Church Fathers"
          subtitle={stats ? `${stats.fathers.toLocaleString('en-US')} excerpts${stats.fullFathers ? '' : ' to start'}` : ' '}
          tint="#FFC107"
          icon={<ScrollIcon />}
          onPress={() => router.push('/fathers')}
        />
        <ShelfTile title="Saints" subtitle="By feast day" tint="#8E5CF6" icon={<SaintIcon />} onPress={() => router.push('/saints')} />
      </View>

      {chips.length ? (
        <View style={{ gap: 10 }}>
          <Text variant="title" style={{ fontSize: 18 }}>
            For today’s feast
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {chips.map((c, i) => (
              <Chip key={c.label} label={c.label} accent={i === 0} onPress={c.onPress} />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
