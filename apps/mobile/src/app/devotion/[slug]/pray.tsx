import { toIsoDate } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Beads } from '@/components/Beads';
import { CloseIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { useContent, useLibrary } from '@/data/content';
import type { Devotion, DevotionStep, NovenaDay, Prayer } from '@/data/types';
import { afterPraying, NOVENA_DAYS, novenaDayIndex } from '@/lib/devotions';
import { ordinal } from '@/lib/format';
import { openCitation } from '@/lib/libraryLinks';
import { useAppState } from '@/state/AppState';

/** Pre-renders every devotion's prayer screen for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const data = require('../../../../assets/content/content.json') as { devotions: string[] };
  return data.devotions.map((slug) => ({ slug }));
}

const VERSICLE = 'V. We adore you, O Christ, and we praise you.\nR. Because by your holy cross you have redeemed the world.';

/**
 * Walks through a devotion one screen at a time, like the Rosary: prayers, beads, Stations,
 * litanies and, for a novena, the day's own prayer. Finishing counts the day's prayer.
 */
export default function DevotionPrayScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const content = useContent();
  const { novenas, saveNovena, recordActivity, progress } = useAppState();
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [prayers, setPrayers] = useState<Record<string, Prayer>>({});
  const [index, setIndex] = useState(0);
  const [bead, setBead] = useState(0);
  const [finished, setFinished] = useState<{ day: number | null } | null>(null);
  const recorded = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const today = toIsoDate(new Date());
  const novena = novenas.find((n) => n.slug === slug);
  // Fixed when the screen opens, so finishing the day doesn't change the text underneath.
  const [dayIndex] = useState(() => novenaDayIndex(novena, today));

  useEffect(() => {
    void content.devotion(String(slug)).then(setDevotion);
    void content.prayers().then((list) => setPrayers(Object.fromEntries(list.map((p) => [p.slug, p]))));
  }, [content, slug]);

  const steps = useMemo(() => devotion?.steps ?? [], [devotion]);
  const step = steps[index];
  const day = devotion?.days?.[dayIndex];

  const advance = () => {
    if (!step || !devotion) return;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    if (step.type === 'repeat' && bead < step.count - 1) {
      setBead(bead + 1);
      return;
    }
    setBead(0);
    if (index < steps.length - 1) {
      setIndex(index + 1);
      scroll.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    if (recorded.current) return;
    recorded.current = true;
    void (async () => {
      if (devotion.kind === 'novena') {
        const next = afterPraying(novena, devotion, today);
        await saveNovena(devotion.slug, next);
        setFinished({ day: next.daysDone });
      } else {
        setFinished({ day: null });
      }
      // A finished devotion counts the day for the streak (SPEC: Gamification). Prayer earns no XP.
      if (!progress?.didPrayerToday) await recordActivity('prayer');
    })();
  };

  if (finished && devotion) {
    return <Complete devotion={devotion} day={finished.day} />;
  }

  const fraction = steps.length ? (index + (step?.type === 'repeat' ? bead / step.count : 0)) / steps.length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => router.back()}>
          <CloseIcon color={t.neutral.textSubtle} />
        </Pressable>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: steps.length, now: index }}
          style={{ flex: 1, height: t.size.progressBar, borderRadius: 8, backgroundColor: t.neutral.border, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(4, fraction * 100)}%`, height: '100%', borderRadius: 8, backgroundColor: t.accent.accent }}>
            <View style={{ position: 'absolute', top: 4, left: 8, right: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </View>
        </View>
      </View>

      {step && devotion ? (
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 14 }}>
          <Text variant="label" caps color={t.neutral.textMuted}>
            {devotion.title}
          </Text>
          <StepView
            key={`${index}`}
            step={step}
            prayers={prayers}
            bead={bead}
            day={day}
            dayNumber={dayIndex + 1}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pax mood="hint" size={140} />
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <RaisedButton label={buttonLabel(step, bead, index === steps.length - 1)} onPress={advance} disabled={!step} />
      </View>
    </View>
  );
}

function buttonLabel(step: DevotionStep | undefined, bead: number, last: boolean): string {
  if (!step) return 'Loading';
  if (step.type === 'repeat') return `${bead + 1} of ${step.count}`;
  if (last) return 'Amen';
  if (step.type === 'station') return 'Next station';
  if (step.type === 'litany' || step.type === 'day') return 'Continue';
  return 'Amen';
}

function StepView({
  step,
  prayers,
  bead,
  day,
  dayNumber,
}: {
  step: DevotionStep;
  prayers: Record<string, Prayer>;
  bead: number;
  day: NovenaDay | undefined;
  dayNumber: number;
}) {
  const t = useTheme();
  const library = useLibrary();

  switch (step.type) {
    case 'prayer': {
      const prayer = prayers[step.slug];
      return (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: 12 }}>
          {step.note ? <Note>{step.note}</Note> : null}
          <Text variant="display" accessibilityRole="header">
            {prayer?.title ?? ''}
          </Text>
          <Text variant="scripture">{prayer?.text ?? ''}</Text>
        </Animated.View>
      );
    }
    case 'text':
      return (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: 12 }}>
          {step.note ? <Note>{step.note}</Note> : null}
          <Text variant="display" accessibilityRole="header">
            {step.title}
          </Text>
          <Text variant="scripture">{step.text}</Text>
        </Animated.View>
      );
    case 'repeat':
      return (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: 12 }}>
          {step.note ? <Note>{step.note}</Note> : null}
          <Text variant="display" accessibilityRole="header">
            {step.title}
          </Text>
          <Beads count={step.count} current={bead} label="Bead" />
          <Text variant="scripture">{step.text}</Text>
        </Animated.View>
      );
    case 'station':
      return (
        <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
          <Card tinted radius={t.radius.card} contentStyle={{ padding: 16, gap: 8 }}>
            <Text variant="label" caps color={t.accent.text}>
              {ordinal(step.number)} station
            </Text>
            <Text variant="display">{step.title}</Text>
            <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
              {VERSICLE}
            </Text>
          </Card>
          <Text variant="scripture">{step.text}</Text>
          {step.citation ? (
            <Pressable accessibilityRole="link" onPress={() => void openCitation(library, step.citation!)} style={{ alignSelf: 'flex-start' }}>
              <Text variant="small" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
                Read {step.citation}
              </Text>
            </Pressable>
          ) : null}
          <Text variant="small" color={t.neutral.textMuted}>
            Our Father · Hail Mary · Glory Be
          </Text>
        </Animated.View>
      );
    case 'litany':
      return (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: 10 }}>
          <Note>Say each line; the response follows it</Note>
          <Text variant="display" accessibilityRole="header">
            {step.title}
          </Text>
          {step.groups.flatMap((g, gi) =>
            g.calls.map((call, ci) => (
              <Text key={`${gi}-${ci}`} variant="body" style={{ fontSize: 17, lineHeight: 25 }}>
                {call}{' '}
                <Text variant="body" color={t.accent.text} style={{ fontSize: 17, lineHeight: 25, fontFamily: 'Nunito_900Black' }}>
                  {g.response}
                </Text>
              </Text>
            )),
          )}
        </Animated.View>
      );
    case 'day':
      return day ? (
        <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
          <Card tinted radius={t.radius.card} contentStyle={{ padding: 16, gap: 8 }}>
            <Text variant="label" caps color={t.accent.text}>
              Day {dayNumber} of {NOVENA_DAYS}
            </Text>
            <Text variant="headline">{day.intention}</Text>
          </Card>
          <Text variant="scripture">{day.text}</Text>
        </Animated.View>
      ) : null;
  }
}

function Note({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text variant="label" caps color={t.neutral.textMuted}>
      {children}
    </Text>
  );
}

function Complete({ devotion, day }: { devotion: Devotion; day: number | null }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const novenaDone = day !== null && day >= NOVENA_DAYS;
  const title = day === null ? 'Amen!' : novenaDone ? 'Novena complete!' : `Day ${day} prayed`;
  const body =
    day === null
      ? `You prayed the ${devotion.title}. Today counts toward your streak.`
      : novenaDone
        ? `You prayed all nine days of the ${devotion.title}. Thank you for persevering.`
        : `See you tomorrow for day ${day + 1}. Today counts toward your streak.`;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.neutral.background,
        padding: 20,
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
        gap: 18,
      }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Animated.View entering={ZoomIn.springify().damping(9)}>
          <Pax mood="celebrating" size={200} />
        </Animated.View>
        <Text variant="display" align="center" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="bodyStrong" align="center" color={t.neutral.textMuted}>
          {body}
        </Text>
      </View>
      <RaisedButton label="Done" onPress={() => router.back()} />
    </View>
  );
}
