import { mysteriesForDay } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Beads } from '@/components/Beads';
import { CloseIcon, FlameIcon, RosaryIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer, RosaryMystery } from '@/data/types';
import { MYSTERY_SET_NAMES, ordinal } from '@/lib/format';
import { rosarySteps, type RosaryStep } from '@/lib/rosary';
import { useAppState } from '@/state/AppState';

export default function RosaryScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const { today, progress, recordActivity } = useAppState();
  const set = today ? mysteriesForDay(today) : 'joyful';
  const [prayers, setPrayers] = useState<Record<string, Prayer>>({});
  const [mysteries, setMysteries] = useState<RosaryMystery[]>([]);
  const [index, setIndex] = useState(0);
  const [bead, setBead] = useState(0);
  const [finishedIn, setFinishedIn] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());
  const recorded = useRef(false);

  useEffect(() => {
    void content.prayers().then((list) => setPrayers(Object.fromEntries(list.map((p) => [p.slug, p]))));
    void content.mysteries(set).then(setMysteries);
  }, [content, set]);

  const steps = useMemo(() => rosarySteps(mysteries), [mysteries]);
  const step = steps[index];

  const next = () => {
    if (step?.kind === 'beads' && bead + 1 < step.count) {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBead(bead + 1);
      return;
    }
    setBead(0);
    if (index + 1 < steps.length) {
      setIndex(index + 1);
    } else {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinishedIn(Math.round((Date.now() - startedAt) / 1000));
      if (!recorded.current) {
        recorded.current = true;
        // A finished prayer counts the day for the streak (SPEC: Gamification). Prayer earns no XP.
        void recordActivity('prayer');
      }
    }
  };

  if (finishedIn !== null) {
    return <Complete set={MYSTERY_SET_NAMES[set]} seconds={finishedIn} streak={progress?.currentStreak ?? 1} />;
  }

  const fraction = steps.length ? (index + (step?.kind === 'beads' ? bead / step.count : 0)) / steps.length : 0;

  return (
    // Padding from the window's insets: SafeAreaView can measure zero inside a full-screen modal on iOS.
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

      {step ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <StepView step={step} prayers={prayers} bead={bead} set={MYSTERY_SET_NAMES[set]} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pax mood="hint" size={140} />
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <RaisedButton label={buttonLabel(step, bead)} onPress={next} disabled={!step} />
      </View>
    </View>
  );
}

function buttonLabel(step: RosaryStep | undefined, bead: number): string {
  if (!step) return 'Loading';
  if (step.kind === 'beads') return `Hail Mary · ${bead + 1} of ${step.count}`;
  if (step.kind === 'mystery') return 'Begin the decade';
  return 'Amen';
}

function StepView({ step, prayers, bead, set }: { step: RosaryStep; prayers: Record<string, Prayer>; bead: number; set: string }) {
  const t = useTheme();
  if (step.kind === 'mystery') {
    const m = step.mystery;
    return (
      <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
        <Card tinted radius={t.radius.card} contentStyle={{ padding: 16, gap: 8 }}>
          <Text variant="label" caps color={t.accent.text}>
            {ordinal(m.number)} {set} mystery
          </Text>
          <Text variant="display">{m.title}</Text>
          <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
            Fruit of the mystery: {m.fruit}
          </Text>
          <Text variant="scripture">{m.meditation}</Text>
          <Text variant="label" color={t.neutral.textMuted}>
            {m.scripture_display}
          </Text>
        </Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <Pax mood="hint" size={84} />
          <View style={{ flex: 1, borderWidth: t.border.width, borderColor: t.neutral.border, borderRadius: t.radius.button, padding: 12 }}>
            <Text variant="label" caps color={t.neutral.textMuted}>
              Pax says
            </Text>
            <Text variant="body">Picture the scene for a moment before you begin. No rush.</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  const prayer = prayers[step.slug];
  return (
    <Animated.View key={`${step.slug}-${step.mystery?.slug ?? ''}`} entering={FadeIn.duration(200)} style={{ gap: 14 }}>
      {step.mystery ? (
        <Text variant="label" caps color={t.accent.text}>
          {ordinal(step.mystery.number)} decade · {step.mystery.title}
        </Text>
      ) : step.note ? (
        <Text variant="label" caps color={t.neutral.textMuted}>
          {step.note}
        </Text>
      ) : null}
      <Text variant="display" accessibilityRole="header">
        {prayer?.title ?? ''}
      </Text>
      {step.kind === 'beads' ? <Beads count={step.count} current={bead} /> : null}
      <Text variant="scripture">{prayer?.text ?? ''}</Text>
    </Animated.View>
  );
}

function Complete({ set, seconds, streak }: { set: string; seconds: number; streak: number }) {
  const t = useTheme();
  const minutes = Math.floor(seconds / 60);
  const time = `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  const insets = useSafeAreaInsets();
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
          Rosary prayed!
        </Text>
        <Text variant="bodyStrong" align="center" color={t.neutral.textMuted}>
          You prayed the {set} Mysteries with Mary. Today counts toward your streak.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Stat color={t.accent.accent} labelColor={t.accent.onAccent} valueColor={t.accent.text} label="Decades" value="5" icon={<RosaryIcon size={20} />} />
          <Stat color={t.game.xp} labelColor="#3B2A00" valueColor={t.game.xpText} label="Time" value={time} />
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
