import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { FatherCard, tidy } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { SectionLabel } from '@/components/LibraryBits';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useFathersPack, useLibrary } from '@/data/content';
import { PACK_SUPPORTED } from '@/data/fathersPack';
import { modernLabel, verseLabel, type BibleNote, type CccParagraph, type FatherExcerpt, type VerseDetail } from '@/data/library';
import { openChapter } from '@/lib/libraryLinks';

/**
 * A verse with everything linked to it, offline: Challoner's note, the Catechism paragraphs
 * that cite it, and what the Fathers said about it (SPEC: Library gate).
 */
export default function VerseScreen() {
  const t = useTheme();
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const library = useLibrary();
  const pack = useFathersPack();
  const [verse, setVerse] = useState<VerseDetail | null>(null);
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [ccc, setCcc] = useState<CccParagraph[]>([]);
  const [fathers, setFathers] = useState<FatherExcerpt[] | null>(null);

  useEffect(() => {
    const key = String(ref);
    void library.verse(key).then(setVerse);
    void library.notes(key).then(setNotes);
    void library.cccForVerse(key).then(setCcc);
    void library.fathersForVerse(key).then(setFathers);
  }, [library, ref]);

  const modern = verse ? modernLabel(verse) : null;
  return (
    <Screen header={<Header close title={verse ? verseLabel(verse) : ''} subtitle={modern ? `${modern} in modern Bibles` : 'Douay-Rheims'} />}>
      {verse ? (
        <Text variant="scripture" selectable style={{ fontSize: 20, lineHeight: 31 }}>
          {verse.text}
        </Text>
      ) : null}
      {verse ? (
        <RaisedButton
          kind="neutral"
          height={46}
          label="Read the chapter"
          onPress={() => {
            router.back();
            openChapter(verse.book, verse.douay_chapter, verse.ref);
          }}
        />
      ) : null}

      {notes.map((n) => (
        <View key={n.seq} style={{ borderLeftWidth: 4, borderLeftColor: t.accent.accent, paddingLeft: 12, gap: 2 }}>
          <SectionLabel color={t.accent.text}>Challoner’s note{n.keyword ? ` · ${n.keyword}` : ''}</SectionLabel>
          <Text variant="body">{n.text}</Text>
        </View>
      ))}

      <View style={{ gap: 10 }}>
        <SectionLabel>The Catechism</SectionLabel>
        {ccc.length === 0 ? (
          <Text variant="small" color={t.neutral.textMuted}>
            The Catechism doesn’t cite this verse directly.
          </Text>
        ) : (
          ccc.map((p) => (
            <Card
              key={p.number}
              onPress={() => router.push({ pathname: '/ccc/[number]', params: { number: String(p.number) } })}
              accessibilityLabel={`Catechism paragraph ${p.number}`}
              contentStyle={{ padding: 14, gap: 2 }}>
              <Text variant="title" style={{ fontSize: 18 }} color={t.game.reviewText}>
                CCC {p.number}
              </Text>
              <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
                {tidy(p.section)} · {tidy(p.heading)}
              </Text>
            </Card>
          ))
        )}
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>The Fathers</SectionLabel>
        {fathers && fathers.length === 0 ? (
          <Text variant="small" color={t.neutral.textMuted}>
            {pack.status === 'ready'
              ? 'No commentary from the Fathers on this verse yet.'
              : 'Nothing in the starter set for this verse.'}
          </Text>
        ) : null}
        {fathers?.map((f) => <FatherCard key={f.slug} excerpt={f} />)}
        {PACK_SUPPORTED && pack.status !== 'ready' ? (
          <Pressable accessibilityRole="link" onPress={() => router.push('/fathers')} style={{ paddingVertical: 4 }}>
            <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
              Get the full Fathers library for more
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
