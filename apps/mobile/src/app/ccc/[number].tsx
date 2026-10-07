import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { tidy } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { SectionLabel } from '@/components/LibraryBits';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import { verseLabel, type CccParagraph, type VerseDetail } from '@/data/library';
import { openVerse } from '@/lib/libraryLinks';

export default function CccParagraphScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ number: string }>();
  const number = Number(params.number);
  const library = useLibrary();
  const [para, setPara] = useState<CccParagraph | null>(null);
  const [verses, setVerses] = useState<VerseDetail[]>([]);

  useEffect(() => {
    void library.ccc(number).then(setPara);
    void library.cccVerses(number).then(setVerses);
  }, [library, number]);

  const go = (n: number) => router.replace({ pathname: '/ccc/[number]', params: { number: String(n) } });

  return (
    <Screen header={<Header title={`CCC ${number}`} subtitle={para ? tidy(para.part) : ''} />}>
      {para ? (
        <View style={{ gap: 4 }}>
          <SectionLabel color={t.accent.text}>{tidy(para.section)}</SectionLabel>
          <Text variant="headline">{tidy(para.heading)}</Text>
        </View>
      ) : null}
      {para?.summary ? (
        <View style={{ borderLeftWidth: 4, borderLeftColor: t.accent.accent, paddingLeft: 12, gap: 2 }}>
          <SectionLabel>In brief (Pax’s summary)</SectionLabel>
          <Text variant="body">{para.summary}</Text>
        </View>
      ) : null}
      {para ? (
        <RaisedButton label="Read it on vatican.va" onPress={() => void WebBrowser.openBrowserAsync(para.vatican_url)} />
      ) : null}

      <View style={{ gap: 10 }}>
        <SectionLabel>Scripture cited here</SectionLabel>
        {verses.length === 0 ? (
          <Text variant="small" color={t.neutral.textMuted}>
            This paragraph doesn’t cite a Bible verse in its footnotes.
          </Text>
        ) : (
          verses.map((v) => (
            <Card key={v.ref} onPress={() => openVerse(v.ref)} accessibilityLabel={verseLabel(v)} contentStyle={{ padding: 14, gap: 4 }}>
              <Text variant="label" caps color={t.neutral.textMuted}>
                {verseLabel(v)}
              </Text>
              <Text variant="scripture" style={{ fontSize: 16, lineHeight: 24 }} numberOfLines={4}>
                {v.text}
              </Text>
            </Card>
          ))
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {number > 1 ? <RaisedButton kind="neutral" height={46} label={`CCC ${number - 1}`} onPress={() => go(number - 1)} style={{ flex: 1 }} /> : null}
        {number < 2865 ? <RaisedButton kind="neutral" height={46} label={`CCC ${number + 1}`} onPress={() => go(number + 1)} style={{ flex: 1 }} /> : null}
      </View>
    </Screen>
  );
}
