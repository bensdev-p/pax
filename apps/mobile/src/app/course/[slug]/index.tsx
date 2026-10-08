import { toIsoDate } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyReminder } from '@/components/DailyReminder';
import { Header } from '@/components/Header';
import { CheckIcon, ChevronIcon } from '@/components/Icons';
import { SectionLabel } from '@/components/LibraryBits';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Course, CourseDay } from '@/data/types';
import { daysBehind, isFinished, nextDay, startCourse } from '@/lib/courses';
import { useAppState } from '@/state/AppState';

type DayRow = Pick<CourseDay, 'day' | 'section' | 'title' | 'label'>;

/** Pre-renders every plan page for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const data = require('../../../../assets/content/content.json') as { courses: Record<string, number> };
  return Object.keys(data.courses).map((slug) => ({ slug }));
}

/** A reading plan: what it is, where you are, a reminder, and its days. */
export default function CourseScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const content = useContent();
  const { courses, saveCourse } = useAppState();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [days, setDays] = useState<DayRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const today = toIsoDate(new Date());

  useEffect(() => {
    void content.course(String(slug)).then(setCourse);
    void content.courseDays(String(slug)).then(setDays);
  }, [content, slug]);

  if (course === null) {
    return (
      <Screen header={<Header title="Not found" />}>
        <Text variant="body">This plan isn’t in Pax yet.</Text>
      </Screen>
    );
  }
  if (!course) return <Screen header={<Header title="" />}>{null}</Screen>;

  const progress = courses.find((c) => c.slug === course.slug);
  const finished = !!progress && isFinished(progress);
  const next = progress ? nextDay(progress) : 1;
  const behind = progress ? daysBehind(progress, today) : 0;
  const openDay = (day: number) =>
    router.push({ pathname: '/course/[slug]/[day]', params: { slug: course.slug, day: String(day) } });

  const start = async () => {
    if (!progress || finished) await saveCourse(course.slug, startCourse(course, today));
    openDay(finished || !progress ? 1 : next);
  };

  // A window around where you are, unless the whole list is open.
  const from = showAll ? 1 : Math.max(1, next - 2);
  const to = showAll ? days.length : Math.min(days.length, from + 9);
  const visible = days.filter((d) => d.day >= from && d.day <= to);
  const sectionIntro = (name: string | null) => course.sections.find((s) => s.name === name)?.intro;

  return (
    <Screen
      header={
        <Header
          title={course.title}
          subtitle={`${course.days} days${course.minutes ? ` · about ${course.minutes} minutes a day` : ''}`}
        />
      }
      footer={
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12 }}>
          <RaisedButton
            label={!progress ? 'Start the plan · Day 1' : finished ? 'Start again from day 1' : `Read day ${next}`}
            onPress={() => void start()}
          />
        </View>
      }>
      <Text variant="body" style={{ fontSize: 16, lineHeight: 23 }}>
        {course.intro}
      </Text>

      {progress ? (
        <Card tinted radius={t.radius.card} contentStyle={{ padding: 16, gap: 12 }}>
          <Text variant="label" caps color={t.accent.text}>
            {finished ? 'Plan complete' : `${progress.daysDone} of ${course.days} days read`}
          </Text>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: t.neutral.border, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max(2, (progress.daysDone / course.days) * 100)}%`,
                height: '100%',
                borderRadius: 5,
                backgroundColor: t.accent.accent,
              }}
            />
          </View>
          <Text variant="small" color={t.neutral.textMuted}>
            {finished
              ? 'You read every day of this plan. Well done!'
              : progress.lastDoneOn === today
                ? 'Today’s reading is done. See you tomorrow, or read ahead.'
                : behind > 1
                  ? `You’re ${behind} days behind the calendar. No rush: the plan waits for you.`
                  : 'One day at a time.'}
          </Text>
          {!finished ? (
            <DailyReminder
              time={progress.reminderTime}
              defaultTime="07:00"
              onChange={(time) => saveCourse(course.slug, { ...progress, reminderTime: time })}
            />
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => void saveCourse(course.slug, null)} style={{ alignSelf: 'flex-start' }}>
            <Text variant="small" color={t.neutral.textMuted} style={{ textDecorationLine: 'underline' }}>
              {finished ? 'Clear' : 'Stop this plan'}
            </Text>
          </Pressable>
        </Card>
      ) : null}

      <View style={{ gap: 2 }}>
        {visible.map((d, i) => {
          const done = !!progress && d.day <= progress.daysDone;
          const isNext = !!progress && !finished && d.day === next;
          const newSection = d.section && (i === 0 || visible[i - 1]?.section !== d.section);
          return (
            <View key={d.day}>
              {newSection ? (
                <View style={{ paddingTop: 12, gap: 4 }}>
                  <SectionLabel>{d.section}</SectionLabel>
                  {sectionIntro(d.section) && (i > 0 || d.day === 1) ? (
                    <Text variant="small" color={t.neutral.textMuted} style={{ paddingBottom: 6 }}>
                      {sectionIntro(d.section)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Day ${d.day}, ${d.title}${done ? ', read' : ''}`}
                onPress={() => openDay(d.day)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  marginHorizontal: -8,
                  borderRadius: t.radius.tile,
                  backgroundColor: pressed ? t.neutral.surfaceMuted : isNext ? t.accent.tint : 'transparent',
                })}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? t.accent.accent : 'transparent',
                    borderWidth: done ? 0 : t.border.width,
                    borderColor: isNext ? t.accent.accent : t.neutral.border,
                  }}>
                  {done ? (
                    <CheckIcon size={16} color={t.accent.onAccent} />
                  ) : (
                    <Text variant="label" color={isNext ? t.accent.text : t.neutral.textSubtle} style={{ fontSize: 12 }}>
                      {d.day}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                    {d.title}
                  </Text>
                  <Text variant="small" color={t.neutral.textMuted}>
                    {d.label}
                  </Text>
                </View>
                <ChevronIcon color={t.neutral.textSubtle} />
              </Pressable>
            </View>
          );
        })}
      </View>
      {days.length > visible.length ? (
        <Pressable accessibilityRole="button" onPress={() => setShowAll(true)} style={{ alignSelf: 'center', padding: 8 }}>
          <Text variant="body" color={t.accent.text} style={{ fontFamily: 'Nunito_800ExtraBold', textDecorationLine: 'underline' }}>
            Show all {days.length} days
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
