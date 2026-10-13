import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { BookChip, pairs, QuillBadge } from '@/components/FatherBits';
import { Header } from '@/components/Header';
import { ChevronIcon } from '@/components/Icons';
import { Card } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent, useLibrary } from '@/data/content';
import type { FatherAuthor } from '@/data/library';
import type { Saint } from '@/data/types';
import { booksOf, diedLabel, eraOf, FATHER_ERAS, saintFor, type BookCount } from '@/lib/fathers';

/** A Father: who he is, then the books he comments on, each opening its chapters. */
export default function FatherScreen() {
  const t = useTheme();
  const { author: slug, name } = useLocalSearchParams<{ author: string; name?: string }>();
  const library = useLibrary();
  const content = useContent();
  const [author, setAuthor] = useState<FatherAuthor | null>(null);
  const [books, setBooks] = useState<BookCount[] | null>(null);
  const [saint, setSaint] = useState<Saint | null>(null);

  useEffect(() => {
    void (async () => {
      const [a, refs, all, saints] = await Promise.all([library.fatherAuthor(String(slug)), library.fatherRefs(String(slug)), library.books(), content.saints()]);
      setAuthor(a);
      setBooks(booksOf(refs, all));
      setSaint(a ? saintFor(a, saints) : null);
    })();
  }, [library, content, slug]);

  const title = author?.name ?? String(name ?? slug);
  const openBook = (b: BookCount) => router.push({ pathname: '/fathers/[author]/[book]', params: { author: String(slug), book: b.osis } });
  const top = books && books.length > 6 ? [...books].sort((a, b) => b.count - a.count).slice(0, 4) : [];
  const grid = (list: BookCount[]) =>
    pairs(list).map(([a, b]) => (
      <View key={a.osis} style={{ flexDirection: 'row', gap: 10 }}>
        <BookChip name={a.name} count={a.count} onPress={() => openBook(a)} />
        {b ? <BookChip name={b.name} count={b.count} onPress={() => openBook(b)} /> : <View style={{ flex: 1 }} />}
      </View>
    ));
  const era = author ? FATHER_ERAS.find((e) => e.key === eraOf(author.year))! : null;

  return (
    <Screen header={<Header title={title} subtitle="Commentary by book" />}>
      {author ? (
        <Card tinted contentStyle={{ padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <QuillBadge year={author.year} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label" caps color={t.accent.text}>
                {[era?.label, diedLabel(author)?.replace(/^d\. /, 'died ')].filter(Boolean).join(' · ')}
              </Text>
              {author.also.length ? (
                <Text variant="small" color={t.neutral.textMuted}>
                  Also called {author.also.join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <Stat value={author.excerpts} label={author.excerpts === 1 ? 'excerpt' : 'excerpts'} />
            {books ? <Stat value={books.length} label={books.length === 1 ? 'book' : 'books'} /> : null}
          </View>
          {saint ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/saint/[key]', params: { key: saint.romcal_key } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="bodyStrong" color={t.accent.text} style={{ fontFamily: 'Nunito_900Black' }}>
                About {saint.name.replace(/^Saint /, 'St ')}
              </Text>
              <ChevronIcon size={16} color={t.accent.text} />
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {top.length ? (
        <View style={{ gap: 10 }}>
          <Text variant="title">Most on</Text>
          {grid(top)}
        </View>
      ) : null}
      {(['OT', 'NT'] as const).map((testament) => {
        const list = (books ?? []).filter((b) => b.testament === testament);
        if (!list.length) return null;
        return (
          <View key={testament} style={{ gap: 10 }}>
            <Text variant="title">{testament === 'OT' ? 'Old Testament' : 'New Testament'}</Text>
            {grid(list)}
          </View>
        );
      })}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const t = useTheme();
  return (
    <View>
      <Text variant="headline" style={{ fontVariant: ['tabular-nums'] }}>
        {value.toLocaleString('en-US')}
      </Text>
      <Text variant="small" color={t.neutral.textMuted}>
        {label}
      </Text>
    </View>
  );
}
