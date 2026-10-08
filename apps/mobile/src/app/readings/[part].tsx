import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/components/Header';
import { Passage } from '@/components/Passage';
import { RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { VerseDetail } from '@/data/library';
import { openCitation } from '@/lib/libraryLinks';
import { READING_PARTS, READINGS_XP, readingsOf, readParts, type ReadingPart } from '@/lib/readings';
import { useAppState } from '@/state/AppState';

/** Pre-renders the four reading pages for the static web build. */
export async function generateStaticParams(): Promise<{ part: string }[]> {
  return READING_PARTS.map(({ part }) => ({ part }));
}

/**
 * One of today's readings in full, from the Douay-Rheims. "Done" marks it read and moves on;
 * finishing the last one counts the readings for the streak.
 */
export default function ReadingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { part } = useLocalSearchParams<{ part: ReadingPart }>();
  const library = useLibrary();
  const { today, settings, updateSettings, recordActivity, progress } = useAppState();
  const [segments, setSegments] = useState<VerseDetail[][] | null>(null);

  const list = today ? readingsOf(today) : [];
  const index = list.findIndex((r) => r.part === part);
  const reading = list[index];
  const citation = reading?.citation;

  useEffect(() => {
    if (!citation) return;
    void library.passage(citation).then(setSegments);
  }, [library, citation]);

  if (!today || !reading) return null;

  const read = readParts(settings, today.date);
  const nextUnread = list.find((r) => r.part !== reading.part && !read.includes(r.part));
  const finishing = !nextUnread;

  const done = async () => {
    const parts = [...new Set([...read, reading.part])];
    await updateSettings({ readingsRead: { date: today.date, parts } });
    if (finishing) {
      if (!progress?.didReadingsToday) await recordActivity('readings', READINGS_XP);
      router.back();
    } else {
      router.replace({ pathname: '/readings/[part]', params: { part: nextUnread.part } });
    }
  };

  const first = segments?.[0]?.[0];
  const douayNote =
    first && (first.douay_chapter !== first.chapter || first.name !== first.name_douay)
      ? `${first.name === 'Psalms' ? 'Psalm' : first.name} ${first.chapter} is ${first.name_douay} ${first.douay_chapter} in the Douay-Rheims.`
      : null;

  return (
    <Screen
      header={<Header title={reading.label} subtitle={`${reading.citation} · Douay-Rheims`} />}
      footer={
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12 }}>
          <RaisedButton
            label={finishing ? (progress?.didReadingsToday ? 'Done' : `Finish · +${READINGS_XP} XP`) : `Done · Next: ${nextUnread.label}`}
            onPress={() => void done()}
          />
        </View>
      }>
      {douayNote ? (
        <Text variant="small" color={t.neutral.textMuted}>
          {douayNote}
        </Text>
      ) : null}

      {segments === null ? null : segments.length === 0 ? (
        <View style={{ gap: 8 }}>
          <Text variant="body">I couldn’t find this passage in the Douay-Rheims. USCCB.org has it.</Text>
          <Pressable accessibilityRole="link" onPress={() => void WebBrowser.openBrowserAsync(today.usccbUrl)}>
            <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
              Open USCCB.org
            </Text>
          </Pressable>
        </View>
      ) : (
        segments.map((verses, i) => (
          <View key={verses[0]!.ref} style={{ gap: 4 }}>
            {i > 0 ? (
              <Text variant="label" color={t.neutral.textSubtle} align="center" accessibilityLabel="Verses skipped">
                · · ·
              </Text>
            ) : null}
            <Passage verses={verses} />
          </View>
        ))
      )}

      <Pressable
        accessibilityRole="link"
        onPress={() => void openCitation(library, reading.citation)}
        style={{ alignSelf: 'center', padding: 6, marginTop: 4 }}>
        <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
          Read it in context
        </Text>
      </Pressable>
    </Screen>
  );
}
