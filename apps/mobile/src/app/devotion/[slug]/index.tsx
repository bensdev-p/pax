import { toIsoDate } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/components/Header';
import { BellIcon, CheckIcon } from '@/components/Icons';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TimePicker } from '@/components/TimePicker';
import { useContent } from '@/data/content';
import type { Devotion } from '@/data/types';
import { KIND_LABELS, NOVENA_DAYS, novenaWindow } from '@/lib/devotions';
import { shortDate } from '@/lib/saints';
import { formatTime } from '@/notifications/plan';
import { requestPermission } from '@/notifications/reminders';
import { useAppState } from '@/state/AppState';

/** Pre-renders every devotion page for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const data = require('../../../../assets/content/content.json') as { devotions: string[] };
  return data.devotions.map((slug) => ({ slug }));
}

/** A devotion's introduction; for a novena, the nine-day tracker and its daily reminder. */
export default function DevotionScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const content = useContent();
  const { novenas, saveNovena } = useAppState();
  const [devotion, setDevotion] = useState<Devotion | null | undefined>(undefined);
  const [dates, setDates] = useState<{ start: string; end: string; feast: string } | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const today = toIsoDate(new Date());

  useEffect(() => {
    void content.devotion(String(slug)).then(setDevotion);
  }, [content, slug]);

  useEffect(() => {
    if (devotion?.anchor) void novenaWindow(devotion.anchor, today).then(setDates);
  }, [devotion, today]);

  if (devotion === null) {
    return (
      <Screen header={<Header title="Not found" />}>
        <Text variant="body">This devotion isn’t in Pax yet.</Text>
      </Screen>
    );
  }
  if (!devotion) return <Screen header={<Header title="" />}>{null}</Screen>;

  const novena = devotion.kind === 'novena';
  const progress = novenas.find((n) => n.slug === devotion.slug);
  const finished = !!progress && progress.daysDone >= NOVENA_DAYS;
  const prayedToday = progress?.lastPrayedOn === today;
  const pray = () => router.push({ pathname: '/devotion/[slug]/pray', params: { slug: devotion.slug } });

  const setReminder = async (time: string | null) => {
    if (!progress) return;
    setNotice(null);
    if (time && Platform.OS !== 'web' && (await requestPermission()) !== 'granted') {
      setNotice('Notifications are off for Pax. You can turn them on in your phone’s Settings.');
      return;
    }
    await saveNovena(devotion.slug, { ...progress, reminderTime: time });
  };

  const buttonLabel = !novena
    ? 'Begin'
    : finished
      ? 'Pray it again from day 1'
      : !progress
        ? 'Start the novena · Day 1'
        : prayedToday
          ? `Pray day ${progress.daysDone} again`
          : `Pray day ${progress.daysDone + 1}`;

  return (
    <Screen
      header={
        <Header
          title={devotion.title}
          subtitle={`${KIND_LABELS[devotion.kind]}${devotion.minutes ? ` · About ${devotion.minutes} minutes` : ''}`}
        />
      }
      footer={
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12 }}>
          <RaisedButton
            label={buttonLabel}
            onPress={() => {
              if (finished) void saveNovena(devotion.slug, null).then(pray);
              else pray();
            }}
          />
        </View>
      }>
      <Text variant="body" style={{ fontSize: 16, lineHeight: 23 }}>
        {devotion.intro}
      </Text>

      {novena ? (
        <Card tinted={!!progress} radius={t.radius.card} contentStyle={{ padding: 16, gap: 12 }}>
          <Text variant="label" caps color={progress ? t.accent.text : t.neutral.textMuted}>
            {finished ? 'Novena complete' : progress ? `Day ${Math.min(NOVENA_DAYS, progress.daysDone + (prayedToday ? 0 : 1))} of ${NOVENA_DAYS}` : 'Nine days of prayer'}
          </Text>
          <View accessibilityLabel={`${progress?.daysDone ?? 0} of ${NOVENA_DAYS} days prayed`} style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: NOVENA_DAYS }, (_, i) => {
              const done = i < (progress?.daysDone ?? 0);
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    maxWidth: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? t.accent.accent : t.neutral.surface,
                    borderWidth: done ? 0 : t.border.width,
                    borderColor: t.neutral.border,
                  }}>
                  {done ? <CheckIcon size={14} color={t.accent.onAccent} /> : (
                    <Text variant="label" color={t.neutral.textSubtle} style={{ fontSize: 11 }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          <Text variant="small" color={t.neutral.textMuted}>
            {finished
              ? 'You prayed all nine days. Well done!'
              : prayedToday
                ? 'Today’s prayer is done. Come back tomorrow for the next day.'
                : dates
                  ? `To end on the feast, start on ${shortDate(dates.start)} and pray through ${shortDate(dates.end)}. You can also pray it any time.`
                  : 'Pray one day at a time, nine days in a row.'}
          </Text>
          {progress && !finished ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <BellIcon />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {progress.reminderTime ? `Reminder at ${formatTime(progress.reminderTime)}` : 'Daily reminder'}
                </Text>
                {progress.reminderTime ? (
                  <Pressable accessibilityRole="button" onPress={() => void setReminder(null)} hitSlop={8}>
                    <Text variant="label" caps color={t.neutral.textMuted}>
                      Turn off
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" onPress={() => setEditingTime(!editingTime)} hitSlop={8}>
                  <Text variant="label" caps color={t.accent.text}>
                    {editingTime ? 'Done' : progress.reminderTime ? 'Change' : 'Set'}
                  </Text>
                </Pressable>
              </View>
              {editingTime ? (
                <TimePicker value={progress.reminderTime ?? '19:00'} onChange={(time) => void setReminder(time)} />
              ) : null}
              {notice ? (
                <Text variant="small" color={t.neutral.textMuted}>
                  {notice}
                </Text>
              ) : null}
            </View>
          ) : null}
          {progress ? (
            <Pressable accessibilityRole="button" onPress={() => void saveNovena(devotion.slug, null)} style={{ alignSelf: 'flex-start' }}>
              <Text variant="small" color={t.neutral.textMuted} style={{ textDecorationLine: 'underline' }}>
                {finished ? 'Clear' : 'Stop this novena'}
              </Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {novena && devotion.days ? (
        <View style={{ gap: 6 }}>
          <Text variant="title" style={{ fontSize: 18 }}>
            The nine days
          </Text>
          {devotion.days.map((d, i) => (
            <View key={d.title} style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
              <Text variant="label" caps color={t.accent.text} style={{ width: 44, paddingTop: 2 }}>
                Day {i + 1}
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {d.intention}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
