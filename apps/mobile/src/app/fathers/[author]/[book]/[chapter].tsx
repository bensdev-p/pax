import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { FatherCard } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { ChevronIcon } from '@/components/Icons';
import { RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { FatherExcerpt } from '@/data/library';
import { chaptersOf, versesOf } from '@/lib/fathers';
import { openVerse } from '@/lib/libraryLinks';

/** Excerpts shown per verse before "more". */
const FIRST = 2;

type Verse = { verse: number; ref: string; slugs: string[] };

/** One chapter of a Father's commentary, verse by verse, with the next chapter a tap away. */
export default function FatherChapterScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ author: string; book: string; chapter: string }>();
  const author = String(params.author);
  const book = String(params.book);
  const chapter = Number(params.chapter);
  const library = useLibrary();
  const [title, setTitle] = useState('');
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [excerpts, setExcerpts] = useState<Record<string, FatherExcerpt>>({});
  const [around, setAround] = useState<{ prev?: number; next?: number }>({});
  const [opened, setOpened] = useState<number[]>([]);

  useEffect(() => {
    void (async () => {
      const [a, b, refs, places] = await Promise.all([library.fatherAuthor(author), library.book(book), library.fatherRefs(author, book), library.douayPlaces(book)]);
      setTitle(`${a?.name ?? ''} on ${b?.name_douay ?? book} ${chapter}`);
      const list = versesOf(refs, places, chapter);
      setVerses(list);
      const chapters = chaptersOf(refs, places).map((c) => c.chapter);
      const i = chapters.indexOf(chapter);
      setAround({ prev: chapters[i - 1], next: i >= 0 ? chapters[i + 1] : undefined });
      const found = await library.fatherExcerptsBySlug(list.flatMap((v) => v.slugs));
      setExcerpts(Object.fromEntries(found.map((e) => [e.slug, e])));
    })();
  }, [library, author, book, chapter]);

  const total = (verses ?? []).reduce((n, v) => n + v.slugs.length, 0);
  const goTo = (c: number) => router.replace({ pathname: '/fathers/[author]/[book]/[chapter]', params: { author, book, chapter: String(c) } });

  return (
    <Screen
      header={
        <Header
          title={title || ' '}
          subtitle={verses ? `${total} ${total === 1 ? 'excerpt' : 'excerpts'} · ${verses.length} ${verses.length === 1 ? 'verse' : 'verses'}` : undefined}
        />
      }>
      {(verses ?? []).map((v) => {
        const all = opened.includes(v.verse);
        const shown = all ? v.slugs : v.slugs.slice(0, FIRST);
        const more = v.slugs.length - shown.length;
        return (
          <View key={v.verse} style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open verse ${v.verse}`}
              onPress={() => openVerse(v.ref)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="label" caps color={t.accent.text} style={{ flex: 1 }}>
                Verse {v.verse}
                {v.slugs.length > 1 ? ` · ${v.slugs.length}` : ''}
              </Text>
              <Text variant="label" caps color={t.accent.text}>
                Open
              </Text>
              <ChevronIcon size={14} color={t.accent.text} />
            </Pressable>
            {shown.map((slug) => (excerpts[slug] ? <FatherCard key={slug} excerpt={excerpts[slug]} byWork /> : null))}
            {more > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => setOpened([...opened, v.verse])} hitSlop={6}>
                <Text variant="small" color={t.accent.text} style={{ fontFamily: 'Nunito_900Black' }}>
                  + {more} more on verse {v.verse}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {around.prev !== undefined || around.next !== undefined ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {around.prev !== undefined ? <RaisedButton kind="neutral" height={44} style={{ flex: 1 }} label={`‹ Chapter ${around.prev}`} onPress={() => goTo(around.prev!)} /> : <View style={{ flex: 1 }} />}
          {around.next !== undefined ? <RaisedButton kind="neutral" height={44} style={{ flex: 1 }} label={`Chapter ${around.next} ›`} onPress={() => goTo(around.next!)} /> : <View style={{ flex: 1 }} />}
        </View>
      ) : null}
    </Screen>
  );
}
