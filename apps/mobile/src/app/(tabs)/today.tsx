import { mysteriesForDay, type DaySnapshot, type ReadingCitations } from '@pax/liturgy';
import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, View } from 'react-native';

import { AdventWreath, BookIcon, CandleIcon, CheckIcon, PrayerCardIcon, RosaryIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton, RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import { cycleLine, dayLabel, MYSTERY_SET_NAMES, paxGreeting, paxMoodFor } from '@/lib/format';
import { openCitation } from '@/lib/libraryLinks';
import { useAppState } from '@/state/AppState';

export default function TodayScreen() {
  const t = useTheme();
  const { today, progress, recordActivity } = useAppState();
  const library = useLibrary();
  if (!today) return null;

  const openUsccb = () => void WebBrowser.openBrowserAsync(today.usccbUrl);
  const mysteries = mysteriesForDay(today);
  const mood = { doneToday: !!progress?.doneToday, hour: new Date().getHours() };

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

      <RosaryCard set={MYSTERY_SET_NAMES[mysteries]} prayed={!!progress?.didPrayerToday} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title">Today’s readings</Text>
          <View
            accessibilityLabel={`Liturgical color: ${today.color}`}
            style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent.accent }}
          />
        </View>
        {today.readings ? (
          <ReadingRows
            readings={today.readings}
            onPress={(citation) => void openCitation(library, citation).then((ok) => !ok && openUsccb())}
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
          label={progress?.didReadingsToday ? 'Readings done' : 'I read today’s readings'}
          icon={progress?.didReadingsToday ? <CheckIcon color={t.neutral.textMuted} /> : undefined}
          disabled={progress?.didReadingsToday}
          onPress={() => void recordActivity('readings')}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile label="Readings" tint="#FF6B6B" icon={<BookIcon />} onPress={openUsccb} />
        <Tile label="Rosary" tint="#8E5CF6" icon={<RosaryIcon />} onPress={() => router.push('/rosary')} />
        <Tile label="Prayers" tint="#FFC107" icon={<PrayerCardIcon />} onPress={() => router.push('/pray')} />
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

const READING_LABELS: [keyof ReadingCitations, string][] = [
  ['firstReading', 'First reading'],
  ['psalm', 'Psalm'],
  ['secondReading', 'Second reading'],
  ['gospel', 'Gospel'],
];

/** Each reading opens in the Douay-Rheims reader, with the cited verses highlighted. */
function ReadingRows({ readings, onPress }: { readings: ReadingCitations; onPress: (citation: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {READING_LABELS.filter(([key]) => readings[key]).map(([key, label]) => {
        const gospel = key === 'gospel';
        return (
          <Card
            key={key}
            tinted={gospel}
            onPress={() => onPress(readings[key]!)}
            accessibilityLabel={`${label}: ${readings[key]}`}
            contentStyle={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 3,
                borderColor: gospel ? t.accent.accent : t.neutral.border,
                backgroundColor: gospel ? t.neutral.surface : 'transparent',
              }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="label" caps color={gospel ? t.accent.text : t.neutral.textMuted}>
                {label}
              </Text>
              <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                {readings[key]}
              </Text>
            </View>
          </Card>
        );
      })}
    </View>
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
