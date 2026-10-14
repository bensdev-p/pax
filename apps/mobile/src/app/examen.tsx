import { useTheme } from '@pax/tokens/react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon, CloseIcon, LockIcon, MoonIcon } from '@/components/Icons';
import { PrayerText } from '@/components/PrayerText';
import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer } from '@/data/types';
import { EXAMEN_STEPS, EXAMEN_TAG, examenEntry } from '@/lib/examen';
import { makeNote } from '@/lib/notes';
import { useAppState } from '@/state/AppState';
import { notes } from '@/state/notes';

/**
 * The nightly Examen (layout A, chosen with Ben): five steps one screen at a time, the Our Father,
 * then an optional private "Write it down" that is saved to the journal only on a tap.
 */
export default function ExamenScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const { recordPrayer } = useAppState();
  const [index, setIndex] = useState(0);
  const [ourFather, setOurFather] = useState<Prayer | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    void content.prayer('our-father').then(setOurFather);
  }, [content]);

  // Five steps, then the Our Father, then the end.
  const closing = index === EXAMEN_STEPS.length;
  const finished = index > EXAMEN_STEPS.length;
  const step = EXAMEN_STEPS[index];

  const next = () => {
    if (closing) {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!recorded.current) {
        recorded.current = true;
        // Counts as Pray for the day (SPEC: Habit model).
        void recordPrayer('examen', 'The Examen');
      }
    }
    setIndex(index + 1);
  };

  if (finished) return <Finish />;

  return (
    // Padding from the window's insets: SafeAreaView can measure zero inside a full-screen modal on iOS.
    <View style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, minHeight: 44 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => router.back()}>
          <CloseIcon color={t.neutral.textSubtle} />
        </Pressable>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Steps"
          accessibilityValue={{ min: 0, max: EXAMEN_STEPS.length, now: Math.min(index + 1, EXAMEN_STEPS.length) }}
          style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
          {EXAMEN_STEPS.map((s, i) => (
            <View key={s.title} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: i <= index ? t.accent.accent : t.neutral.border }} />
          ))}
        </View>
        {index > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={() => setIndex(index - 1)}>
            <BackIcon color={t.neutral.textSubtle} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 20, gap: 18 }}>
        <Animated.View key={index} entering={FadeIn.duration(250)} style={{ gap: 18 }}>
          {step ? (
            <>
              <View style={{ gap: 6 }}>
                <Text variant="label" caps color={t.accent.text}>
                  The Examen · Step {index + 1} of {EXAMEN_STEPS.length}
                </Text>
                <Text variant="display" accessibilityRole="header">
                  {step.title}
                </Text>
              </View>
              <Text variant="scripture" style={{ fontSize: 19, lineHeight: 30 }}>
                {step.guide}
              </Text>
              <View style={{ backgroundColor: t.accent.tint, borderRadius: t.radius.card, paddingVertical: 14, paddingHorizontal: 16, gap: 4 }}>
                <Text variant="label" caps color={t.accent.text}>
                  Ask yourself
                </Text>
                <Text variant="bodyStrong">{step.question}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: 6 }}>
                <Text variant="label" caps color={t.accent.text}>
                  To close
                </Text>
                <Text variant="display" accessibilityRole="header">
                  {ourFather?.title ?? 'Our Father'}
                </Text>
              </View>
              <PrayerText text={ourFather?.text ?? ''} />
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10 }}>
        {step ? (
          <Text variant="small" align="center" color={t.neutral.textSubtle}>
            Take your time. Stay as long as you like.
          </Text>
        ) : null}
        <RaisedButton label={closing ? 'Amen' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

function Finish() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [grateful, setGrateful] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const entry = examenEntry(grateful, tomorrow);

  const close = async (save: boolean) => {
    if (save && entry) {
      await notes.save({
        ...makeNote({ kind: 'journal', targetType: 'entry', prompt: 'The Examen' }),
        body: entry,
        tags: [EXAMEN_TAG],
      });
    }
    router.back();
  };

  const input = {
    multiline: true,
    placeholderTextColor: t.neutral.textSubtle,
    textAlignVertical: 'top' as const,
    style: {
      minHeight: 64,
      borderWidth: t.border.width,
      borderColor: t.neutral.border,
      borderRadius: t.radius.tile,
      paddingVertical: 10,
      paddingHorizontal: 12,
      color: t.neutral.text,
      backgroundColor: t.neutral.surface,
      fontFamily: 'Nunito_700Bold',
      fontSize: t.font.size.bodyLarge,
    },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 28, gap: 18 }}>
        <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.accent.tint, alignItems: 'center', justifyContent: 'center' }}>
            <MoonIcon size={52} />
          </View>
          <Text variant="display" align="center" accessibilityRole="header">
            Examen prayed
          </Text>
          <Text variant="bodyStrong" align="center" color={t.neutral.textMuted}>
            Rest well. Today counts toward your streak.
          </Text>
        </Animated.View>

        <View style={{ borderWidth: t.border.width, borderColor: t.neutral.border, borderRadius: t.radius.card, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="title">Write it down</Text>
            <Text variant="label" caps color={t.neutral.textSubtle}>
              Optional
            </Text>
          </View>
          <Text variant="label" caps color={t.accent.text}>
            Today I’m grateful for
          </Text>
          <TextInput {...input} value={grateful} onChangeText={setGrateful} placeholder="A person, a moment, a gift…" accessibilityLabel="Today I’m grateful for" />
          <Text variant="label" caps color={t.accent.text}>
            Tomorrow I’ll ask for
          </Text>
          <TextInput {...input} value={tomorrow} onChangeText={setTomorrow} placeholder="Patience, courage, peace…" accessibilityLabel="Tomorrow I’ll ask for" />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ paddingTop: 2 }}>
              <LockIcon size={16} color={t.neutral.textSubtle} />
            </View>
            <Text variant="small" color={t.neutral.textMuted} style={{ flex: 1 }}>
              Private: saved only on this phone, in your journal under #{EXAMEN_TAG}, and only if you tap Save.
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        {entry ? (
          <>
            <RaisedButton label="Save to journal" onPress={() => void close(true)} />
            <RaisedButton kind="ghost" label="Close without saving" onPress={() => void close(false)} />
          </>
        ) : (
          <RaisedButton label="Done" onPress={() => void close(false)} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
