import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/components/Header';
import { CheckIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import { clip, verseLabel } from '@/data/library';
import { paxAsks, READINGS_XP, readingsOf, readParts, type ReadingPart } from '@/lib/readings';
import { useAppState } from '@/state/AppState';

/**
 * Today's readings (SPEC: Daily readings canvas): each reading with a check once read in the
 * app, the next one as an "up next" card with its first line, Pax's question and the USCCB link.
 */
export default function ReadingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const library = useLibrary();
  const { today, settings, progress, recordActivity } = useAppState();
  const [firstLine, setFirstLine] = useState<{ text: string; label: string; citation: string } | null>(null);

  const list = today ? readingsOf(today) : [];
  const read = today ? readParts(settings, today.date) : [];
  const next = list.find((r) => !read.includes(r.part));
  const allDone = !!progress?.didReadingsToday || (list.length > 0 && !next);
  const nextCitation = next?.citation;

  useEffect(() => {
    if (!nextCitation) return;
    let cancelled = false;
    void library.passage(nextCitation).then((segments) => {
      const v = segments[0]?.[0];
      if (!cancelled) setFirstLine(v ? { text: clip(v.text, undefined, 150), label: verseLabel(v), citation: nextCitation } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [library, nextCitation]);

  if (!today) return null;
  const open = (part: ReadingPart) => router.push({ pathname: '/readings/[part]', params: { part } });
  const usccb = () => void WebBrowser.openBrowserAsync(today.usccbUrl);

  return (
    <Screen
      header={
        <Header
          title="Today’s readings"
          subtitle={`${today.name} · Year ${today.lectionaryCycle}`}
          right={
            <View
              accessibilityLabel={`Liturgical color: ${today.color}`}
              style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent.accent, marginRight: 4 }}
            />
          }
        />
      }
      footer={
        list.length ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12 }}>
            {allDone ? (
              <RaisedButton kind="neutral" label="Readings done" icon={<CheckIcon color={t.neutral.textMuted} />} onPress={() => router.back()} />
            ) : (
              <RaisedButton
                label={`Read the ${next!.label.toLowerCase()}${read.length === list.length - 1 ? ` · +${READINGS_XP} XP` : ''}`}
                onPress={() => open(next!.part)}
              />
            )}
          </View>
        ) : null
      }>
      {list.length === 0 ? (
        <Card contentStyle={{ padding: 14, gap: 4 }}>
          <Text variant="label" caps color={t.neutral.textMuted}>
            Citations coming soon
          </Text>
          <Text variant="body">I don’t have today’s citations yet. USCCB.org has the full readings.</Text>
        </Card>
      ) : null}

      {list.map(({ part, label, citation }) => {
        const done = allDone || read.includes(part);
        const upNext = !allDone && part === next?.part;
        return (
          <Card
            key={part}
            tinted={upNext}
            onPress={() => open(part)}
            accessibilityLabel={`${label}: ${citation}${done ? ', read' : ''}`}
            contentStyle={{ paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? t.accent.accent : upNext ? t.neutral.surface : 'transparent',
                  borderWidth: done ? 0 : 3,
                  borderColor: upNext ? t.accent.accent : t.neutral.border,
                }}>
                {done ? <CheckIcon color={t.accent.onAccent} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label" caps color={upNext ? t.accent.text : t.neutral.textMuted}>
                  {label}
                  {upNext ? ' · Up next' : ''}
                </Text>
                <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                  {citation}
                </Text>
              </View>
            </View>
            {upNext && firstLine?.citation === citation ? (
              <>
                <Text variant="scripture">“{firstLine.text}”</Text>
                <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                  {firstLine.label} · Douay-Rheims
                </Text>
              </>
            ) : null}
          </Card>
        );
      })}

      {list.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 2 }}>
          <Pax mood="hint" size={64} shadow={false} />
          <View
            style={{
              flex: 1,
              borderWidth: t.border.width,
              borderColor: t.neutral.border,
              borderRadius: t.radius.button,
              paddingVertical: 10,
              paddingHorizontal: 12,
              gap: 2,
            }}>
            <Text variant="label" caps color={t.neutral.textMuted}>
              Pax asks
            </Text>
            <Text variant="body">{paxAsks(today.date)}</Text>
          </View>
        </View>
      ) : null}

      <Pressable accessibilityRole="link" onPress={usccb} style={{ alignSelf: 'center', padding: 6 }}>
        <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
          Full texts on USCCB.org
        </Text>
      </Pressable>
      {list.length && !allDone ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void recordActivity('readings', READINGS_XP)}
          style={{ alignSelf: 'center', padding: 6 }}>
          <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
            Read them somewhere else? Mark them done
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
