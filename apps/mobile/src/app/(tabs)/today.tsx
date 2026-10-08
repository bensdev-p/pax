import { mysteriesForDay, type DaySnapshot } from '@pax/liturgy';
import { tokens, withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AdventWreath, BookIcon, CandleIcon, CheckIcon, ChevronIcon, RosaryIcon, SaintIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton, RaisedSurface } from '@/components/Raised';
import { SaintArt } from '@/components/SaintArt';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Saint } from '@/data/types';
import { cycleLine, dayLabel, MYSTERY_SET_NAMES, paxGreeting, paxMoodFor } from '@/lib/format';
import { isFinished, nextDay } from '@/lib/courses';
import { readingsOf, readParts, type ReadingPart } from '@/lib/readings';
import { saintColor, saintForDay, type Celebration } from '@/lib/saints';
import { useAppState } from '@/state/AppState';

export default function TodayScreen() {
  const t = useTheme();
  const { today, progress, settings, courses } = useAppState();
  const content = useContent();
  const [saint, setSaint] = useState<{ saint: Saint; celebration: Celebration } | null>(null);

  useEffect(() => {
    if (!today) return;
    void saintForDay(content, today).then(setSaint);
  }, [content, today]);

  if (!today) return null;

  const openUsccb = () => void WebBrowser.openBrowserAsync(today.usccbUrl);
  const mysteries = mysteriesForDay(today);
  const mood = { doneToday: !!progress?.doneToday, hour: new Date().getHours() };
  const readings = readingsOf(today);
  const read = progress?.didReadingsToday ? readings.map((r) => r.part) : readParts(settings, today.date);
  const openSaint = () =>
    saint
      ? router.push({ pathname: '/saint/[key]', params: { key: saint.saint.romcal_key, date: today.date } })
      : router.push('/saints');

  return (
    <Screen header={<StatsBar today={today} progress={progress} />}>
      <FeastCard day={today} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pax mood={paxMoodFor(mood)} size={96} />
        <View
          style={{
            flex: 1,
            borderWidth: t.border.width,
            borderColor: t.neutral.border,
            borderRadius: t.radius.button,
            paddingVertical: 12,
            paddingHorizontal: 14,
          }}>
          <Text variant="body">
            {paxGreeting(today, mood)}
          </Text>
        </View>
      </View>

      {saint ? <SaintCard saint={saint.saint} celebration={saint.celebration} onPress={openSaint} /> : null}

      {courses
        .filter((c) => !isFinished(c))
        .map((c) => {
          const doneToday = c.lastDoneOn === today.date;
          return (
            <Card
              key={c.slug}
              onPress={() =>
                doneToday
                  ? router.push({ pathname: '/course/[slug]', params: { slug: c.slug } })
                  : router.push({ pathname: '/course/[slug]/[day]', params: { slug: c.slug, day: String(nextDay(c)) } })
              }
              accessibilityLabel={`${c.title}, day ${nextDay(c)} of ${c.days}`}
              contentStyle={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: doneToday ? t.accent.accent : 'transparent',
                  borderWidth: doneToday ? 0 : 3,
                  borderColor: t.accent.accent,
                }}>
                {doneToday ? <CheckIcon color={t.accent.onAccent} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label" caps color={t.accent.text}>
                  {doneToday ? `Day ${c.daysDone} read` : `Day ${nextDay(c)} of ${c.days}`}
                </Text>
                <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                  {c.title}
                </Text>
              </View>
              <ChevronIcon color={t.neutral.textSubtle} />
            </Card>
          );
        })}

      <RosaryCard set={MYSTERY_SET_NAMES[mysteries]} prayed={!!progress?.didPrayerToday} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title">Today’s readings</Text>
          <View
            accessibilityLabel={`Liturgical color: ${today.color}`}
            style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent.accent }}
          />
        </View>
        {readings.length ? (
          <ReadingRows
            readings={readings}
            read={read}
            onPress={(part) => router.push({ pathname: '/readings/[part]', params: { part } })}
          />
        ) : (
          <Card contentStyle={{ padding: 14, gap: 4 }}>
            <Text variant="label" caps color={t.neutral.textMuted}>
              Citations coming soon
            </Text>
            <Text variant="body">I don’t have today’s citations yet. USCCB.org has the full readings.</Text>
          </Card>
        )}
        <Pressable accessibilityRole="link" onPress={openUsccb} style={{ alignSelf: 'center', padding: 6 }}>
          <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
            Full texts on USCCB.org
          </Text>
        </Pressable>
        <RaisedButton
          kind={progress?.didReadingsToday ? 'neutral' : 'accent'}
          label={progress?.didReadingsToday ? 'Readings done' : read.length ? 'Keep reading' : 'Read today’s readings'}
          icon={progress?.didReadingsToday ? <CheckIcon color={t.neutral.textMuted} /> : undefined}
          onPress={() => router.push('/readings')}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile label="Readings" tint="#FF6B6B" icon={<BookIcon />} onPress={() => router.push('/readings')} />
        <Tile label={saint ? 'Saint' : 'Saints'} tint="#8E5CF6" icon={<SaintIcon size={26} />} onPress={openSaint} />
        <Tile label="Rosary" tint="#2FA4E7" icon={<RosaryIcon />} onPress={() => router.push('/rosary')} />
      </View>
    </Screen>
  );
}

function FeastCard({ day }: { day: DaySnapshot }) {
  const t = useTheme();
  const advent = day.season === 'ADVENT';
  return (
    <View
      style={{
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderRadius: t.radius.hero,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      {advent ? (
        <AdventWreath week={Math.min(4, Math.max(1, day.weekOfSeason))} width={120} />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: t.radius.panel,
            backgroundColor: t.accent.tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <CandleIcon size={40} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" caps color={t.accent.text}>
          {dayLabel(day)}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {day.name}
        </Text>
        <Text variant="small" color={t.neutral.textMuted}>
          {cycleLine(day)}
        </Text>
        {day.isMartyr || day.rank === 'SOLEMNITY' || day.rank === 'FEAST' ? (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: t.accent.accent,
            }}>
            <Text variant="label" caps color={t.accent.onAccent} style={{ fontSize: 11 }}>
              {day.isMartyr ? 'Martyr' : day.rankName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Each reading opens in full; a check marks the ones read today, and the next is tinted. */
function ReadingRows({
  readings,
  read,
  onPress,
}: {
  readings: { part: ReadingPart; label: string; citation: string }[];
  read: ReadingPart[];
  onPress: (part: ReadingPart) => void;
}) {
  const t = useTheme();
  const next = readings.find((r) => !read.includes(r.part))?.part;
  return (
    <View style={{ gap: 10 }}>
      {readings.map(({ part, label, citation }) => {
        const done = read.includes(part);
        const upNext = part === next;
        return (
          <Card
            key={part}
            tinted={upNext}
            onPress={() => onPress(part)}
            accessibilityLabel={`${label}: ${citation}${done ? ', read' : ''}`}
            contentStyle={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: done ? 0 : 3,
                borderColor: upNext ? t.accent.accent : t.neutral.border,
                backgroundColor: done ? t.accent.accent : upNext ? t.neutral.surface : 'transparent',
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
          </Card>
        );
      })}
    </View>
  );
}

/** The saint (or feast) of the day, in that celebration's color (SPEC: Today quick tiles). */
function SaintCard({ saint, celebration, onPress }: { saint: Saint; celebration: Celebration; onPress: () => void }) {
  const t = useTheme();
  const palette = t.locked ? t.accent : tokens.palettes[saintColor(saint, celebration)][t.scheme];
  const feast = saint.kind !== 'saint' && saint.kind !== 'saints';
  return (
    <Card
      onPress={onPress}
      radius={t.radius.card}
      accessibilityLabel={`${feast ? 'Feast' : 'Saint'} of the day: ${saint.name}`}
      contentStyle={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 58, height: 70, borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 48, height: 60, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <SaintArt kind={saint.kind} robe={palette.accent} size={40} />
        </View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" caps color={palette.text}>
          {feast ? 'Feast of the day' : 'Saint of the day'}
          {celebration.optional ? ' · Optional memorial' : ''}
        </Text>
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
          {saint.name}
        </Text>
        {saint.summary ? (
          <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
            {saint.summary}
          </Text>
        ) : null}
      </View>
      <ChevronIcon color={t.neutral.textSubtle} />
    </Card>
  );
}

function RosaryCard({ set, prayed }: { set: string; prayed: boolean }) {
  const t = useTheme();
  return (
    <RaisedSurface
      color={t.accent.accent}
      edgeColor={t.accent.edge}
      edge={t.edge.hero}
      radius={t.radius.panel}
      contentStyle={{ padding: 18, gap: 10 }}>
      <Text variant="label" caps color={t.accent.onAccent}>
        Today’s Rosary · {set} mysteries
      </Text>
      <Text variant="headline" color={t.accent.onAccent}>
        {prayed ? 'You prayed the Rosary today' : `Pray the ${set} Mysteries with Pax`}
      </Text>
      <View accessibilityLabel={prayed ? 'All five decades prayed' : 'Five decades'} style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: prayed || i === 0 ? t.accent.onAccent : withAlpha(t.accent.onAccent, 0.3),
            }}
          />
        ))}
      </View>
      <RaisedButton kind="white" label={prayed ? 'Pray again' : 'Start the Rosary'} height={50} onPress={() => router.push('/rosary')} />
    </RaisedSurface>
  );
}

function Tile({ label, icon, tint, onPress }: { label: string; icon: React.ReactNode; tint: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Card
      onPress={onPress}
      style={{ flex: 1 }}
      accessibilityLabel={label}
      contentStyle={{ paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: t.radius.tile,
          backgroundColor: withAlpha(tint, t.scheme === 'dark' ? 0.22 : 0.15),
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <Text variant="small" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
        {label}
      </Text>
    </Card>
  );
}
