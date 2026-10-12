import { mysteriesForDay, type DaySnapshot } from '@pax/liturgy';
import { tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AdventWreath, CandleIcon, CheckIcon, ChevronIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card } from '@/components/Raised';
import { GraceOfferCard } from '@/components/Rhythm';
import { SaintArt } from '@/components/SaintArt';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Saint } from '@/data/types';
import { cycleLine, dayLabel, MYSTERY_SET_NAMES, paxGreeting, paxMoodFor, shortName } from '@/lib/format';
import { readingsOf, readParts } from '@/lib/readings';
import { saintColor, saintForDay, type Celebration } from '@/lib/saints';
import { todayChecklist, type ChecklistItem } from '@/lib/today';
import { useAppState } from '@/state/AppState';

export default function TodayScreen() {
  const t = useTheme();
  const { today, progress, settings, courses, novenas, answerGraceOffer } = useAppState();
  const content = useContent();
  const [saint, setSaint] = useState<{ saint: Saint; celebration: Celebration } | null>(null);

  useEffect(() => {
    if (!today) return;
    void saintForDay(content, today).then(setSaint);
  }, [content, today]);

  if (!today) return null;

  const mood = { doneToday: !!progress?.doneToday, hour: new Date().getHours() };
  const items = todayChecklist({
    date: today.date,
    rhythm: progress?.rhythm ?? { read: false, pray: false, study: false },
    readings: readingsOf(today),
    readParts: readParts(settings, today.date),
    mysteries: MYSTERY_SET_NAMES[mysteriesForDay(today)],
    prayed: settings.prayedToday,
    novenas,
    courses,
  });

  return (
    <Screen header={<StatsBar today={today} progress={progress} />}>
      {progress?.graceOffer ? (
        <GraceOfferCard offer={progress.graceOffer} left={progress.graceDaysLeft} onAnswer={(a) => void answerGraceOffer(a)} />
      ) : null}

      <FeastCard day={today} saint={saint} />

      <TodayWithGod items={items} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pax mood={paxMoodFor(mood)} size={60} />
        <Text variant="body" color={t.neutral.textMuted} style={{ flex: 1 }}>
          {paxGreeting(today, mood)}
        </Text>
      </View>
    </Screen>
  );
}

/**
 * Today's celebration with the saint or feast of the day folded in (SPEC: Today, item 2). When
 * the saint is the day's own celebration, the card is about them; on a weekday with an optional
 * memorial, the saint sits under the day. Tapping opens the saint's page.
 */
function FeastCard({ day, saint }: { day: DaySnapshot; saint: { saint: Saint; celebration: Celebration } | null }) {
  const t = useTheme();
  const advent = day.season === 'ADVENT';
  const own = !!saint && !saint.celebration.optional;
  const palette = saint ? (t.locked ? t.accent : tokens.palettes[saintColor(saint.saint, saint.celebration)][t.scheme]) : t.accent;
  const feast = !!saint && saint.saint.kind !== 'saint' && saint.saint.kind !== 'saints';
  const open = saint
    ? () => router.push({ pathname: '/saint/[key]', params: { key: saint.saint.romcal_key, date: day.date } })
    : undefined;

  return (
    <Card
      onPress={open}
      radius={t.radius.hero}
      accessibilityLabel={saint ? `${day.name}. ${feast ? 'Feast' : 'Saint'} of the day: ${saint.saint.name}` : day.name}
      contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {advent ? (
          <AdventWreath week={Math.min(4, Math.max(1, day.weekOfSeason))} width={110} />
        ) : own && saint ? (
          <SaintFrame saint={saint.saint} color={palette.accent} />
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

      {saint && (!own || advent) ? (
        // A saint other than the day's own celebration (or under the Advent wreath).
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: t.border.width, borderTopColor: t.neutral.divider }}>
          <SaintFrame saint={saint.saint} color={palette.accent} small />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" caps color={palette.text}>
              {feast ? 'Feast of the day' : 'Saint of the day'}
              {saint.celebration.optional ? ' · Optional memorial' : ''}
            </Text>
            <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
              {saint.saint.name}
            </Text>
            {saint.saint.summary ? (
              <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
                {saint.saint.summary}
              </Text>
            ) : null}
          </View>
          <ChevronIcon color={t.neutral.textSubtle} />
        </View>
      ) : saint ? (
        <View style={{ gap: 8 }}>
          {saint.saint.summary ? (
            <Text variant="body" color={t.neutral.textMuted} numberOfLines={3}>
              {saint.saint.summary}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text variant="label" caps color={palette.text}>
              {feast ? 'About this feast' : `About ${shortName(saint.saint.name)}`}
            </Text>
            <ChevronIcon size={16} color={palette.text} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function SaintFrame({ saint, color, small }: { saint: Saint; color: string; small?: boolean }) {
  const w = small ? 48 : 58;
  const h = small ? 58 : 70;
  return (
    <View style={{ width: w, height: h, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: w - 10, height: h - 10, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <SaintArt kind={saint.kind} robe={color} size={small ? 32 : 40} />
      </View>
    </View>
  );
}

/** One checklist card: Read · Pray · Study, each checking off when done (SPEC: Today, item 3). */
function TodayWithGod({ items }: { items: ChecklistItem[] }) {
  const t = useTheme();
  const done = items.filter((i) => i.done).length;
  return (
    <View
      style={{
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderRadius: t.radius.card,
        overflow: 'hidden',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text variant="title" accessibilityRole="header">
          Today with God
        </Text>
        <Text variant="label" caps color={done === items.length ? t.accent.text : t.neutral.textMuted}>
          {done === items.length ? 'All done' : `${done} of ${items.length}`}
        </Text>
      </View>
      {items.map((item, i) => (
        <Pressable
          key={item.mark}
          accessibilityRole="button"
          accessibilityLabel={`${item.mark}: ${item.title}, ${item.detail}${item.done ? ', done' : ''}`}
          onPress={() => router.push(item.href)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: i ? t.border.width : 0,
            borderTopColor: t.neutral.divider,
            backgroundColor: pressed ? t.accent.tint : 'transparent',
          })}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: item.done ? 0 : 3,
              borderColor: item.optional ? t.neutral.border : t.accent.accent,
              backgroundColor: item.done ? t.accent.accent : 'transparent',
            }}>
            {item.done ? <CheckIcon color={t.accent.onAccent} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" caps color={item.optional ? t.neutral.textSubtle : t.accent.text}>
              {MARK_LABELS[item.mark]}
            </Text>
            <Text
              variant="bodyStrong"
              color={item.optional ? t.neutral.textMuted : undefined}
              style={{ fontFamily: 'Nunito_900Black' }}>
              {item.title}
            </Text>
            <Text variant="small" color={t.neutral.textMuted}>
              {item.detail}
            </Text>
          </View>
          <ChevronIcon color={t.neutral.textSubtle} />
        </Pressable>
      ))}
    </View>
  );
}

const MARK_LABELS = { read: 'Read', pray: 'Pray', study: 'Study' } as const;
