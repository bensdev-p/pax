import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { WritingChapterView } from '@/components/Writing';
import { useContent } from '@/data/content';
import type { Writing, WritingChapter } from '@/data/types';

/** Pre-renders every work for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const data = require('../../../assets/content/content.json') as { writings: string[] };
  return data.writings.map((slug) => ({ slug }));
}

/**
 * A Father's or saint's own work, read whole (Phase 4). `chapter` scrolls to a chapter and tints
 * it, as when a saint's quote is opened in its letter.
 */
export default function WritingScreen() {
  const params = useLocalSearchParams<{ slug: string; chapter?: string }>();
  const content = useContent();
  const [found, setFound] = useState<{ work: Writing; chapters: WritingChapter[] } | null | undefined>(undefined);
  const scroll = useRef<ScrollView>(null);
  const target = params.chapter !== undefined ? Number(params.chapter) : null;

  useEffect(() => {
    void content.writing(String(params.slug)).then(setFound);
  }, [content, params.slug]);

  return (
    <Screen
      scroll={false}
      contentStyle={{ padding: 0 }}
      header={<Header title={found?.work.title ?? (found === null ? 'Not found' : '')} subtitle={found?.work.translation} />}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 40 }}>
        {found === null ? <Text variant="body">This work isn’t in Pax.</Text> : null}
        {found?.chapters.map((c) => (
          <View
            key={c.number}
            onLayout={(e) => {
              // Bring the linked chapter into view once it has a place on the page.
              if (c.number === target) scroll.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: false });
            }}>
            <WritingChapterView chapter={c} highlight={c.number === target} />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
