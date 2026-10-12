import { getDaySnapshot, toIsoDate } from '@pax/liturgy';
import { tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon, ChevronIcon, ScrollIcon, ShareIcon } from '@/components/Icons';
import { Card } from '@/components/Raised';
import { SaintArt } from '@/components/SaintArt';
import { Text } from '@/components/Text';
import { useContent, useLibrary } from '@/data/content';
import type { FatherAuthor } from '@/data/library';
import type { Saint } from '@/data/types';
import { openCitation } from '@/lib/libraryLinks';
import { quoteSource } from '@/lib/quoteSources';
import { celebrationsOf, rankChip, saintColor, shortDate, type Celebration } from '@/lib/saints';

/** Pre-renders every saint page for the static web build. */
export async function generateStaticParams(): Promise<{ key: string }[]> {
  const data = require('../../../assets/content/content.json') as { saints: string[] };
  return data.saints.map((key) => ({ key }));
}

/**
 * Saint of the day (SPEC: Saint of the day): a header in the celebration's color with card art,
 * rank chip and subtitle; a quote; three quick facts; the bio; and links to the saint's writings.
 * `date` says which day it was opened for, so the rank and color match that celebration.
 */
export default function SaintScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ key: string; date?: string }>();
  const key = String(params.key);
  const content = useContent();
  const library = useLibrary();
  const [saint, setSaint] = useState<Saint | null | undefined>(undefined);
  const [celebration, setCelebration] = useState<Celebration | undefined>(undefined);
  const [authors, setAuthors] = useState<FatherAuthor[]>([]);
  const today = toIsoDate(new Date());
  const date = params.date ? String(params.date) : today;
  const source = saint ? quoteSource(saint) : null;
  const openSource = () => {
    if (source?.kind === 'scripture') void openCitation(library, source.citation);
    else if (source) void WebBrowser.openBrowserAsync(source.url);
  };

  useEffect(() => {
    void content.saint(key).then(setSaint);
    void getDaySnapshot(date).then((day) => setCelebration(celebrationsOf(day).find((c) => c.key === key)));
  }, [content, key, date]);

  useEffect(() => {
    if (!saint?.fathers.length) return;
    void library.fatherAuthors().then((all) => setAuthors(all.filter((a) => saint.fathers.includes(a.slug))));
  }, [library, saint]);

  if (saint === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top + 60, padding: 24, gap: 12 }}>
        <Text variant="title">No write-up yet</Text>
        <Text variant="body" color={t.neutral.textMuted}>
          Pax doesn’t have this celebration yet.
        </Text>
      </View>
    );
  }

  const palette = t.locked || !saint ? t.accent : tokens.palettes[saintColor(saint, celebration)][t.scheme];
  const chip = saint ? rankChip(saint, celebration) : null;
  const isFeast = saint && saint.kind !== 'saint' && saint.kind !== 'saints';
  const when = celebration ? shortDate(celebration.date) : saint?.month_day ? shortDate(saint.month_day) : null;
  const label = [date === today && celebration ? (isFeast ? 'Feast of the day' : 'Saint of the day') : isFeast ? 'Feast' : 'Saint', when]
    .filter(Boolean)
    .join(' · ');

  const share = () => {
    if (!saint) return;
    void Share.share({ message: `${saint.name}${when ? ` (${when})` : ''}\n\n${saint.summary ?? ''}\n\nShared from Pax` });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.neutral.background }}>
      {/* The header runs under the status bar, so its icons take the header's text color. */}
      <StatusBar style={palette.onAccent.toUpperCase() === '#FFFFFF' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Accent header with a raised bottom edge, as on the canvas. */}
        <View style={{ backgroundColor: palette.edge, paddingBottom: 6, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <View
            style={{
              backgroundColor: palette.accent,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              paddingTop: insets.top + 6,
              paddingHorizontal: 16,
              paddingBottom: 22,
              gap: 14,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={8}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
                style={{ width: 44, height: 44, justifyContent: 'center' }}>
                <BackIcon color={palette.onAccent} />
              </Pressable>
              <Text variant="label" caps color={palette.onAccent}>
                {label}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share"
                hitSlop={8}
                onPress={share}
                style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}>
                <ShareIcon color={palette.onAccent} />
              </Pressable>
            </View>
            {saint ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 92,
                    height: 112,
                    borderRadius: 18,
                    backgroundColor: '#FFFFFF',
                    borderBottomWidth: 5,
                    borderBottomColor: 'rgba(0,0,0,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <SaintArt kind={saint.kind} robe={palette.accent === '#FFFFFF' ? palette.edge : palette.accent} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  {chip ? (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,255,255,0.22)',
                      }}>
                      <Text variant="label" caps color={palette.onAccent} style={{ fontSize: 12 }}>
                        {chip}
                      </Text>
                    </View>
                  ) : null}
                  <Text variant="headline" color={palette.onAccent} accessibilityRole="header" style={{ fontSize: 26, lineHeight: 29 }}>
                    {saint.name}
                  </Text>
                  {saint.subtitle ? (
                    <Text variant="body" color={palette.onAccent}>
                      {saint.subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={{ height: 112 }} />
            )}
          </View>
        </View>

        {saint ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 22, gap: 14 }}>
            {saint.quote ? (
              // Tapping the quote opens where it comes from: the Bible reader, or the whole work online.
              <Pressable
                disabled={!source}
                onPress={openSource}
                accessibilityRole={source ? 'link' : undefined}
                accessibilityHint={source ? (source.kind === 'scripture' ? 'Opens the passage in the Bible' : 'Opens the whole work') : undefined}
                style={({ pressed }) => ({
                  borderWidth: t.border.width,
                  borderColor: t.neutral.border,
                  borderRadius: t.radius.card,
                  padding: 16,
                  gap: 8,
                  backgroundColor: pressed ? t.neutral.surfaceMuted : 'transparent',
                })}>
                <Text variant="scripture">“{saint.quote}”</Text>
                {saint.quote_source ? (
                  <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                    {saint.quote_source}
                  </Text>
                ) : null}
                {source ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text variant="label" caps color={t.accent.text}>
                      {source.kind === 'scripture' ? 'Read it in the Bible' : 'Read the whole work'}
                    </Text>
                    <ChevronIcon size={16} color={t.accent.text} />
                  </View>
                ) : null}
              </Pressable>
            ) : null}

            {saint.facts.length ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {saint.facts.map((f) => (
                  <View
                    key={f.label}
                    style={{
                      flex: 1,
                      borderWidth: t.border.width,
                      borderColor: t.neutral.border,
                      borderRadius: t.radius.button,
                      paddingVertical: 10,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                      gap: 2,
                    }}>
                    <Text variant="headline" color={palette.text} style={{ fontSize: 22, lineHeight: 26 }} numberOfLines={1} adjustsFontSizeToFit>
                      {f.value}
                    </Text>
                    <Text variant="small" color={t.neutral.textMuted} align="center" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {saint.summary ? <Text variant="bodyStrong">{saint.summary}</Text> : null}
            {saint.bio
              ? saint.bio.split(/\n\n+/).map((para) => (
                  <Text key={para.slice(0, 24)} variant="body" style={{ fontSize: 16, lineHeight: 23 }}>
                    {para}
                  </Text>
                ))
              : null}

            {saint.dates || saint.patronage ? (
              <View style={{ borderRadius: t.radius.button, backgroundColor: t.neutral.surfaceMuted, padding: 14, gap: 8 }}>
                {saint.dates ? <Fact label="Lived" value={saint.dates} /> : null}
                {saint.patronage ? <Fact label="Patron of" value={saint.patronage} /> : null}
              </View>
            ) : null}

            {authors.map((a) => (
              <Card
                key={a.slug}
                onPress={() => router.push({ pathname: '/fathers/[author]', params: { author: a.slug, name: a.name } })}
                accessibilityLabel={`Read ${a.name} in the Church Fathers library`}
                contentStyle={{ paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: t.radius.tile,
                    backgroundColor: t.scheme === 'dark' ? 'rgba(255,193,7,0.22)' : '#FFF1D6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ScrollIcon size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                    Read {a.name}
                  </Text>
                  <Text variant="small" color={t.neutral.textMuted}>
                    Church Fathers · {a.excerpts.toLocaleString('en-US')} excerpts
                  </Text>
                </View>
                <ChevronIcon color={t.neutral.textSubtle} />
              </Card>
            ))}

            <Text variant="small" color={t.neutral.textSubtle} align="center">
              Written for Pax{saint.quote ? '. Quotation from a public-domain translation' : ''}.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Text variant="label" caps color={t.neutral.textMuted} style={{ width: 78, paddingTop: 2 }}>
        {label}
      </Text>
      <Text variant="body" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}
