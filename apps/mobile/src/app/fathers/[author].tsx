import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { FatherCard } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { useLibrary } from '@/data/content';
import type { FatherExcerpt, VerseDetail } from '@/data/library';
import { verseLabel } from '@/data/library';
import { openVerse } from '@/lib/libraryLinks';

const PAGE = 40;

export default function FatherScreen() {
  const { author, name } = useLocalSearchParams<{ author: string; name?: string }>();
  const library = useLibrary();
  const [limit, setLimit] = useState(PAGE);
  const [excerpts, setExcerpts] = useState<FatherExcerpt[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    void library.fatherExcerpts(String(author), limit + 1).then(async (list) => {
      setExcerpts(list);
      const next: Record<string, string> = {};
      for (const e of list) {
        if (!e.ref) continue;
        const v: VerseDetail | null = await library.verse(e.ref);
        if (v) next[e.ref] = verseLabel(v);
      }
      setLabels(next);
    });
  }, [library, author, limit]);

  return (
    <Screen header={<Header title={String(name ?? author)} subtitle="Commentary by verse" />}>
      {excerpts.slice(0, limit).map((e) => (
        <View key={e.slug} style={{ gap: 6 }}>
          <FatherCard excerpt={e} showRef={e.ref ? labels[e.ref] : undefined} />
          {e.ref ? <RaisedButton kind="ghost" label={`Open ${labels[e.ref] ?? 'the verse'}`} onPress={() => openVerse(e.ref!)} /> : null}
        </View>
      ))}
      {excerpts.length > limit ? <RaisedButton kind="neutral" label="Show more" onPress={() => setLimit(limit + PAGE)} /> : null}
    </Screen>
  );
}
