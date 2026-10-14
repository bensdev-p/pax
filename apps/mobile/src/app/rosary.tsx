import { mysteriesForDay } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Beads } from '@/components/Beads';
import { Choice } from '@/components/Choice';
import { CloseIcon, FlameIcon, RosaryIcon, UndoIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { PrayerText } from '@/components/PrayerText';
import { Card, RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer, RosaryMystery } from '@/data/types';
import { MYSTERY_SET_NAMES, ordinal } from '@/lib/format';
import { isMysterySet } from '@/lib/pray';
import { citeRuns, decadeProgress, prayerWords, rosarySteps, stepBack, type RosaryStep } from '@/lib/rosary';
import { useAppState } from '@/state/AppState';

/**
 * The Rosary (chosen with Ben from mockups, Phase 4): a start page with the day's five mysteries,
 * then each decade with its mystery kept on screen and a Douay verse for every Hail Mary. It can
 * also walk through the mysteries alone (for praying on your own beads), or log a Rosary prayed
 * away from the app. English or Latin.
 */
type Phase = { kind: 'start' } | { kind: 'beads' } | { kind: 'mysteries' } | { kind: 'done'; seconds: number | null };

export default function RosaryScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const { today, progress, recordPrayer, settings, updateSettings } = useAppState();
  // Today's set unless another was chosen on the mysteries page.
  const params = useLocalSearchParams<{ set?: string }>();
  const todays = today ? mysteriesForDay(today) : 'joyful';
  const set = isMysterySet(params.set) ? params.set : todays;
  const [prayers, setPrayers] = useState<Record<string, Prayer>>({});
  const [mysteries, setMysteries] = useState<RosaryMystery[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: 'start' });
  const [startedAt, setStartedAt] = useState(0);
  const recorded = useRef(false);

  useEffect(() => {
    void content.prayers().then((list) => setPrayers(Object.fromEntries(list.map((p) => [p.slug, p]))));
    void content.mysteries(set).then(setMysteries);
  }, [content, set]);

  const finish = (timed: boolean) => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase({ kind: 'done', seconds: timed ? Math.round((Date.now() - startedAt) / 1000) : null });
    if (!recorded.current) {
      recorded.current = true;
      // A finished or logged Rosary counts the day for the streak (SPEC: Habit model).
      void recordPrayer('rosary', 'The Rosary');
    }
  };

  const begin = (kind: 'beads' | 'mysteries') => {
    setStartedAt(Date.now());
    setPhase({ kind });
  };

  const setName = MYSTERY_SET_NAMES[set];
  let body: React.ReactNode;
  if (phase.kind === 'done') {
    return <Complete set={setName} seconds={phase.seconds} streak={progress?.currentStreak ?? 1} />;
  } else if (phase.kind === 'start') {
    body = (
      <StartView
        set={setName}
        isToday={set === todays}
        mysteries={mysteries}
        latin={settings.rosaryLatin}
        onLatin={(latin) => void updateSettings({ rosaryLatin: latin })}
        onBegin={() => begin('beads')}
        onMysteriesOnly={() => begin('mysteries')}
        onLog={() => finish(false)}
      />
    );
  } else if (phase.kind === 'beads') {
    body = (
      <BeadsView
        mysteries={mysteries}
        prayers={prayers}
        set={setName}
        latin={settings.rosaryLatin}
        words={settings.rosaryWords}
        onWords={(words) => void updateSettings({ rosaryWords: words })}
        onDone={() => finish(true)}
      />
    );
  } else {
    body = <MysteriesView mysteries={mysteries} set={setName} onDone={() => finish(true)} />;
  }

  return (
    // Padding from the window's insets: SafeAreaView can measure zero inside a full-screen modal on iOS.
    <View style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {mysteries.length ? (
        body
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pax mood="hint" size={140} />
        </View>
      )}
    </View>
  );
}

function TopBar({ marks, onBack, title }: { marks?: number[]; onBack?: () => void; title?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, minHeight: 44 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => router.back()}>
        <CloseIcon color={t.neutral.textSubtle} />
      </Pressable>
      {marks ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Decades"
          accessibilityValue={{ min: 0, max: 5, now: marks.filter((m) => m >= 1).length }}
          style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
          {marks.map((m, i) => (
            <View key={i} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: t.neutral.border, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(m * 100)}%`, height: '100%', borderRadius: 5, backgroundColor: t.accent.accent }} />
            </View>
          ))}
        </View>
      ) : (
        <Text variant="label" caps align="center" color={t.accent.text} style={{ flex: 1 }}>
          {title ?? ''}
        </Text>
      )}
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back one" hitSlop={10} onPress={onBack}>
          <UndoIcon color={t.neutral.textSubtle} />
        </Pressable>
      ) : (
        <View style={{ width: 26 }} />
      )}
    </View>
  );
}

function StartView({
  set,
  isToday,
  mysteries,
  latin,
  onLatin,
  onBegin,
  onMysteriesOnly,
  onLog,
}: {
  set: string;
  isToday: boolean;
  mysteries: RosaryMystery[];
  latin: boolean;
  onLatin: (latin: boolean) => void;
  onBegin: () => void;
  onMysteriesOnly: () => void;
  onLog: () => void;
}) {
  const t = useTheme();
  return (
    <>
      <TopBar />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 2 }}>
          <Text variant="label" caps color={t.accent.text}>
            {isToday ? 'Today’s mysteries' : 'The Rosary'}
          </Text>
          <Text variant="display" accessibilityRole="header">
            The {set} Mysteries
          </Text>
        </View>
        <Card contentStyle={{ padding: 16, gap: 10 }}>
          {mysteries.map((m) => (
            <View key={m.slug} style={{ flexDirection: 'row', gap: 10 }}>
              <Text variant="bodyStrong" color={t.accent.text} style={{ width: 18, fontFamily: 'Nunito_900Black' }}>
                {m.number}
              </Text>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{m.title}</Text>
                <Text variant="small" color={t.neutral.textMuted}>
                  Fruit: {m.fruit}
                </Text>
              </View>
            </View>
          ))}
        </Card>
        <View style={{ gap: 8 }}>
          <Text variant="label" caps color={t.neutral.textMuted}>
            Pray in
          </Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
            <Choice label="English" selected={!latin} onPress={() => onLatin(false)} />
            <Choice label="Latin" selected={latin} onPress={() => onLatin(true)} />
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 }}>
        <RaisedButton label="Begin" onPress={onBegin} />
        <RaisedButton kind="neutral" label="Mysteries only" onPress={onMysteriesOnly} />
        <Text variant="small" align="center" color={t.neutral.textMuted}>
          Mysteries only: for praying on your own rosary.
        </Text>
        <Pressable accessibilityRole="button" onPress={onLog} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 6 }}>
          <Text variant="label" caps color={t.accent.text}>
            I prayed it already · Log it
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function BeadsView({
  mysteries,
  prayers,
  set,
  latin,
  words,
  onWords,
  onDone,
}: {
  mysteries: RosaryMystery[];
  prayers: Record<string, Prayer>;
  set: string;
  latin: boolean;
  words: boolean;
  onWords: (words: boolean) => void;
  onDone: () => void;
}) {
  const t = useTheme();
  const steps = useMemo(() => rosarySteps(mysteries), [mysteries]);
  const [index, setIndex] = useState(0);
  const [bead, setBead] = useState(0);
  const step = steps[index];

  const next = () => {
    if (step?.kind === 'beads' && bead + 1 < step.count) {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBead(bead + 1);
      return;
    }
    setBead(0);
    if (index + 1 < steps.length) {
      // A firmer tap at the end of each decade, felt without looking.
      if (step?.kind === 'beads' && step.count === 10 && Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIndex(index + 1);
    } else {
      onDone();
    }
  };

  const back = () => {
    const prev = stepBack(steps, index, bead);
    setIndex(prev.index);
    setBead(prev.bead);
  };

  if (!step) return null;
  const marks = decadeProgress(steps, index, bead);
  const prayer = step.kind === 'mystery' ? null : prayerWords(prayers[step.slug], latin);

  return (
    <>
      <TopBar marks={marks} onBack={index > 0 || bead > 0 ? back : undefined} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 14 }}>
        {step.kind === 'mystery' || step.mystery ? (
          <MysteryCard step={step} bead={bead} set={set} />
        ) : step.note ? (
          <Text variant="label" caps color={t.neutral.textMuted}>
            {step.note}
          </Text>
        ) : null}

        {step.kind === 'mystery' ? (
          <Animated.View entering={FadeIn.duration(250)} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Pax mood="hint" size={72} />
            <View style={{ flex: 1, borderWidth: t.border.width, borderColor: t.neutral.border, borderRadius: t.radius.button, padding: 12 }}>
              <Text variant="label" caps color={t.neutral.textMuted}>
                Pax says
              </Text>
              <Text variant="body">Picture the scene for a moment before you begin. No rush.</Text>
            </View>
          </Animated.View>
        ) : (
          // The whole prayer is a tap target: the next bead without looking for the button.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${prayer?.title ?? ''}. Next`}
            onPress={next}
            style={{ flexGrow: 1, gap: 10 }}>
            <Animated.View key={`${index}`} entering={FadeIn.duration(200)} style={{ gap: 10 }}>
              {step.kind === 'beads' ? <Beads count={step.count} current={bead} label={prayer?.title} /> : null}
              <Text variant="title" accessibilityRole="header">
                {prayer?.title}
              </Text>
              {words ? (
                <PrayerText text={prayer?.text ?? ''} />
              ) : (
                <Text variant="scripture" color={t.neutral.textMuted}>
                  {firstLine(prayer?.text ?? '')}
                </Text>
              )}
            </Animated.View>
          </Pressable>
        )}

        {step.kind !== 'mystery' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onWords(!words)}
            hitSlop={6}
            style={{
              alignSelf: 'flex-start',
              borderWidth: t.border.width,
              borderColor: t.neutral.border,
              borderRadius: t.radius.chip,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}>
            <Text variant="label" caps color={t.neutral.textMuted}>
              {words ? 'Hide the words' : 'Show the words'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <RaisedButton label={buttonLabel(step, bead, prayer?.title ?? '')} onPress={next} />
      </View>
    </>
  );
}

/** The decade's mystery stays on screen: its meditation, then a verse for each Hail Mary. */
function MysteryCard({ step, bead, set }: { step: RosaryStep; bead: number; set: string }) {
  const t = useTheme();
  const m = step.kind === 'mystery' ? step.mystery : step.mystery!;
  const verse = step.kind === 'beads' ? m.beads[bead] : undefined;
  return (
    <Card tinted radius={t.radius.card} contentStyle={{ padding: 16, gap: 6 }}>
      <Text variant="label" caps color={t.accent.text}>
        {ordinal(m.number)} {set} mystery · Fruit: {m.fruit}
      </Text>
      <Text variant="headline">{m.title}</Text>
      {verse ? (
        <Animated.View key={verse.ref} entering={FadeIn.duration(200)} style={{ gap: 4 }}>
          <Text variant="scripture">{verse.text}</Text>
          <Text variant="label" color={t.neutral.textMuted}>
            {verse.cite}
          </Text>
        </Animated.View>
      ) : (
        <View style={{ gap: 4 }}>
          <Text variant="scripture">{m.meditation}</Text>
          <Text variant="label" color={t.neutral.textMuted}>
            {m.scripture_display}
          </Text>
        </View>
      )}
    </Card>
  );
}

/**
 * For praying on your own beads: one mystery at a time, its ten verses as one passage sized to
 * fit the screen (Ben: no scrolling to see them), to read along while praying the decade.
 */
function MysteriesView({ mysteries, set, onDone }: { mysteries: RosaryMystery[]; set: string; onDone: () => void }) {
  const t = useTheme();
  const [index, setIndex] = useState(0);
  const m = mysteries[index];
  if (!m) return null;
  const last = index + 1 >= mysteries.length;
  return (
    <>
      <TopBar marks={mysteries.map((_, i) => (i <= index ? 1 : 0))} onBack={index > 0 ? () => setIndex(index - 1) : undefined} />
      <Animated.View key={m.slug} entering={FadeIn.duration(250)} style={{ flex: 1, padding: 16, paddingBottom: 0, gap: 12 }}>
        {/* The verses carry the scene here, so the card leaves out the meditation to give them room. */}
        <Card tinted radius={t.radius.card} contentStyle={{ paddingVertical: 12, paddingHorizontal: 16, gap: 2 }}>
          <Text variant="label" caps color={t.accent.text}>
            {ordinal(m.number)} {set} mystery
          </Text>
          <Text variant="headline" accessibilityRole="header">
            {m.title}
          </Text>
          <Text variant="small" color={t.neutral.textMuted}>
            Fruit: {m.fruit}
          </Text>
        </Card>
        <FitPassage text={m.beads.map((v) => v.text).join(' ')} cite={citeRuns(m.beads)} />
      </Animated.View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <RaisedButton
          label={last ? 'Amen' : 'Next mystery'}
          onPress={() => {
            if (last) onDone();
            else setIndex(index + 1);
          }}
        />
      </View>
    </>
  );
}

const PASSAGE_SIZES = [18, 17, 16, 15, 14, 13, 12];

/** Scripture text that steps down in size until it fits the space left; scrolls only below 12 pt. */
function FitPassage({ text, cite }: { text: string; cite: string }) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  // Either size can be measured first; whichever comes second decides.
  const measured = useRef({ space: 0, content: 0 });
  const size = PASSAGE_SIZES[step]!;
  const check = () => {
    const { space, content } = measured.current;
    if (space && content > space && step + 1 < PASSAGE_SIZES.length) setStep(step + 1);
  };
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 8 }}
      onLayout={(e) => {
        measured.current.space = e.nativeEvent.layout.height;
        check();
      }}>
      <View
        onLayout={(e) => {
          measured.current.content = e.nativeEvent.layout.height;
          check();
        }}
        style={{ gap: 6 }}>
        <Text variant="scripture" style={{ fontSize: size, lineHeight: Math.round(size * 1.45) }}>
          {text}
        </Text>
        <Text variant="label" color={t.neutral.textMuted}>
          {cite}
        </Text>
      </View>
    </ScrollView>
  );
}

function firstLine(text: string): string {
  const line = text.split('\n').find((l) => l.trim()) ?? '';
  return `${line.replace(/[,;:.]$/, '')}…`;
}

function buttonLabel(step: RosaryStep, bead: number, title: string): string {
  if (step.kind === 'beads') return `${title} · ${bead + 1} of ${step.count}`;
  if (step.kind === 'mystery') return 'Begin the decade';
  return 'Amen';
}

function Complete({ set, seconds, streak }: { set: string; seconds: number | null; streak: number }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const time = seconds === null ? null : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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
          {time ? 'Rosary prayed!' : 'Rosary logged'}
        </Text>
        <Text variant="bodyStrong" align="center" color={t.neutral.textMuted}>
          {time
            ? `You prayed the ${set} Mysteries with Mary. Today counts toward your streak.`
            : 'Thank you for praying. Today counts toward your streak.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, alignSelf: 'stretch' }}>
          <Stat color={t.accent.accent} labelColor={t.accent.onAccent} valueColor={t.accent.text} label="Decades" value="5" icon={<RosaryIcon size={20} />} />
          {time ? <Stat color={t.game.xp} labelColor="#3B2A00" valueColor={t.game.xpText} label="Time" value={time} /> : null}
          <Stat color={t.game.streak} labelColor="#FFFFFF" valueColor={t.game.streakText} label="Streak" value={String(Math.max(1, streak))} icon={<FlameIcon size={20} />} />
        </View>
      </View>
      <RaisedButton label="Done" onPress={() => router.back()} />
    </View>
  );
}

function Stat({
  label,
  value,
  color,
  labelColor,
  valueColor,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  labelColor: string;
  valueColor: string;
  icon?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, borderRadius: t.radius.button, backgroundColor: color, padding: 2, paddingTop: 0 }}>
      <Text variant="label" caps align="center" numberOfLines={1} color={labelColor} style={{ paddingVertical: 4, fontSize: 11, letterSpacing: 0.4 }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: t.neutral.surface,
          borderRadius: t.radius.tile,
          paddingVertical: 10,
          flexDirection: 'row',
          gap: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
        <Text variant="title" color={valueColor}>
          {value}
        </Text>
      </View>
    </View>
  );
}
