import { toIsoDate } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/Icons';
import { Pax, type PaxMood } from '@/components/Pax';
import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import { SUGGESTED_NOTIFICATION_PREFS, type Course } from '@/data/types';
import { startCourse } from '@/lib/courses';
import { REASONS, suggestedPlan, type Reason } from '@/lib/onboarding';
import { formatTime } from '@/notifications/plan';
import { requestPermission } from '@/notifications/reminders';
import { useAppState } from '@/state/AppState';

type Step = 'hello' | 'reason' | 'plan' | 'reminder' | 'done';

/**
 * First run (SPEC: Planned screens, Onboarding): hello, what brings you here, a suggested plan,
 * a reminder. Every step can be skipped. The answer only picks the suggestion; it isn't stored.
 */
export default function WelcomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const { courses: started, saveCourse, updateSettings, updateNotificationPrefs } = useAppState();
  const web = Platform.OS === 'web';
  const steps: Step[] = web ? ['hello', 'reason', 'plan', 'done'] : ['hello', 'reason', 'plan', 'reminder', 'done'];

  const [step, setStep] = useState<Step>('hello');
  const [reason, setReason] = useState<Reason | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [planStarted, setPlanStarted] = useState<string | null>(null);
  const [reminder, setReminder] = useState<'on' | 'denied' | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void content.courses().then(setCourses);
  }, [content]);

  const suggestion = suggestedPlan(reason);
  const plan = courses.find((c) => c.slug === (picked ?? suggestion.slug));
  const then = suggestion.then && !picked ? courses.find((c) => c.slug === suggestion.then) : undefined;
  const next = () => setStep(steps[steps.indexOf(step) + 1] ?? 'done');

  const finish = async (thenOpen?: '/reminders') => {
    await updateSettings({ onboarded: true });
    if (thenOpen) router.replace(thenOpen);
    else if (router.canGoBack()) router.back();
    else router.replace('/today');
  };

  const startPlan = async () => {
    if (!plan) return next();
    setBusy(true);
    try {
      if (!started.some((c) => c.slug === plan.slug)) await saveCourse(plan.slug, startCourse(plan, toIsoDate(new Date())));
      setPlanStarted(plan.title);
      next();
    } finally {
      setBusy(false);
    }
  };

  const remindMe = async () => {
    setBusy(true);
    try {
      if ((await requestPermission()) !== 'granted') {
        setReminder('denied');
        return;
      }
      await updateNotificationPrefs(SUGGESTED_NOTIFICATION_PREFS);
      setReminder('on');
      next();
    } finally {
      setBusy(false);
    }
  };

  const mood: PaxMood = step === 'done' ? 'celebrating' : step === 'reason' ? 'hint' : step === 'reminder' ? 'happy' : 'hello';

  return (
    <View style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, minHeight: 44 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${steps.indexOf(step) + 1} of ${steps.length}`}>
          {steps.map((s, i) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: i <= steps.indexOf(step) ? t.accent.accent : t.neutral.border,
              }}
            />
          ))}
        </View>
        {step !== 'done' ? (
          <Pressable accessibilityRole="button" onPress={() => void finish()} hitSlop={10} style={{ paddingLeft: 16 }}>
            <Text variant="label" caps color={t.neutral.textMuted}>
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 18 }}>
        <View style={{ alignItems: 'center' }}>
          <Pax mood={mood} size={step === 'hello' || step === 'done' ? 170 : 120} />
        </View>

        {step === 'hello' ? (
          <Intro
            title="Peace be with you! I’m Pax."
            body="Each day the Church gives us readings, a saint and a season to live in. I’ll help you read, pray and study along with her, one day at a time."
          />
        ) : null}

        {step === 'reason' ? (
          <>
            <Intro title="What brings you here?" body="This only helps me suggest where to start. I won’t keep your answer." />
            <View style={{ gap: 10 }}>
              {REASONS.map((r) => (
                <Choice key={r.value} title={r.label} detail={r.detail} selected={reason === r.value} onPress={() => setReason(r.value)} />
              ))}
            </View>
          </>
        ) : null}

        {step === 'plan' ? (
          <>
            <Intro
              title="A place to start"
              body="A reading plan gives each day a little Study. Miss a day and it simply waits for you."
            />
            {plan && !showAll ? (
              <Choice title={plan.title} detail={`${plan.summary} · ${plan.days} days`} selected onPress={() => setShowAll(true)} />
            ) : null}
            {then && !showAll ? (
              <Text variant="small" color={t.neutral.textMuted} align="center">
                {`Afterwards: ${then.title}, to learn what the Church believes.`}
              </Text>
            ) : null}
            {showAll ? (
              <View style={{ gap: 10 }}>
                {courses.map((c) => (
                  <Choice
                    key={c.slug}
                    title={c.title}
                    detail={`${c.summary} · ${c.days} days`}
                    selected={plan?.slug === c.slug}
                    onPress={() => {
                      setPicked(c.slug);
                      setShowAll(false);
                    }}
                  />
                ))}
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setShowAll(true)} style={{ alignSelf: 'center', padding: 6 }}>
                <Text variant="body" color={t.accent.text} style={{ fontFamily: 'Nunito_800ExtraBold', textDecorationLine: 'underline' }}>
                  See other plans
                </Text>
              </Pressable>
            )}
          </>
        ) : null}

        {step === 'reminder' ? (
          <>
            <Intro
              title="Want a nudge from me?"
              body={`I can remind you each evening at ${formatTime(SUGGESTED_NOTIFICATION_PREFS.evening.time)}, and once more on days nothing’s done yet. Once today counts, I stay quiet.`}
            />
            {reminder === 'denied' ? (
              <Text variant="small" color={t.neutral.textMuted} align="center">
                Notifications are off for Pax on this phone. You can allow them in the phone’s Settings and turn reminders on in Me.
              </Text>
            ) : null}
          </>
        ) : null}

        {step === 'done' ? (
          <Intro
            title="You’re all set"
            body={[
              planStarted ? `${planStarted} is waiting for you under Study.` : null,
              reminder === 'on' ? 'I’ll remind you this evening.' : null,
              'Today shows your Read · Pray · Study each day. Any one of them keeps your streak.',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 4 }}>
        {step === 'hello' ? <RaisedButton label="Let’s begin" onPress={next} /> : null}
        {step === 'reason' ? (
          <>
            <RaisedButton label="Continue" disabled={!reason} onPress={next} />
            <RaisedButton kind="ghost" label="Rather not say" onPress={next} />
          </>
        ) : null}
        {step === 'plan' ? (
          <>
            <RaisedButton label={plan ? `Start ${plan.title}` : 'Continue'} disabled={busy} onPress={() => void startPlan()} />
            <RaisedButton kind="ghost" label="Not now" onPress={next} />
          </>
        ) : null}
        {step === 'reminder' ? (
          <>
            <RaisedButton label="Remind me" disabled={busy} onPress={() => void remindMe()} />
            <View style={{ flexDirection: 'row' }}>
              <RaisedButton kind="ghost" label="Choose times" style={{ flex: 1 }} onPress={() => void finish('/reminders')} />
              <RaisedButton kind="ghost" label="Not now" style={{ flex: 1 }} onPress={next} />
            </View>
          </>
        ) : null}
        {step === 'done' ? <RaisedButton label="Go to Today" onPress={() => void finish()} /> : null}
      </View>
    </View>
  );
}

function Intro({ title, body }: { title: string; body: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="display" align="center" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="bodyStrong" align="center" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_700Bold' }}>
        {body}
      </Text>
    </View>
  );
}

function Choice({ title, detail, selected, onPress }: { title: string; detail: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: t.radius.button,
        borderWidth: t.border.width,
        borderBottomWidth: pressed ? t.border.width : t.edge.card,
        marginTop: pressed ? t.edge.card - t.border.width : 0,
        borderColor: selected ? t.accent.accent : t.neutral.border,
        backgroundColor: selected ? t.accent.tint : t.neutral.surface,
      })}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? 0 : 3,
          borderColor: t.neutral.border,
          backgroundColor: selected ? t.accent.accent : 'transparent',
        }}>
        {selected ? <CheckIcon size={14} color={t.accent.onAccent} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }} color={selected ? t.accent.text : undefined}>
          {title}
        </Text>
        <Text variant="small" color={t.neutral.textMuted}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}
