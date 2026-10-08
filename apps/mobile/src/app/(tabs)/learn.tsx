import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BookIcon, ChevronIcon, LockIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton, RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Course } from '@/data/types';
import { isFinished, nextDay } from '@/lib/courses';
import { useAppState } from '@/state/AppState';

/** Reading plans now; the OCIA path joins them later (SPEC: Learn). */
export default function LearnScreen() {
  const t = useTheme();
  const content = useContent();
  const { courses: progress, today } = useAppState();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    void content.courses().then(setCourses);
  }, [content]);

  const active = progress.filter((p) => !isFinished(p));
  const finished = new Set(progress.filter(isFinished).map((p) => p.slug));
  const available = courses.filter((c) => !active.some((p) => p.slug === c.slug));
  const open = (slug: string) => router.push({ pathname: '/course/[slug]', params: { slug } });

  return (
    <Screen>
      <Text variant="hero" style={{ fontSize: 28 }} accessibilityRole="header">
        Learn
      </Text>

      {active.length === 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pax mood="hint" size={84} />
          <View
            style={{
              flex: 1,
              borderWidth: t.border.width,
              borderColor: t.neutral.border,
              borderRadius: t.radius.button,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}>
            <Text variant="body">Pick a reading plan and we’ll take it one day at a time. Miss a day? It waits for you.</Text>
          </View>
        </View>
      ) : null}

      {active.map((p) => {
        const day = nextDay(p);
        const doneToday = p.lastDoneOn === today?.date;
        return (
          <RaisedSurface
            key={p.slug}
            color={t.accent.accent}
            edgeColor={t.accent.edge}
            edge={t.edge.hero}
            radius={t.radius.panel}
            contentStyle={{ padding: 18, gap: 10 }}>
            <Text variant="label" caps color={t.accent.onAccent}>
              {doneToday ? 'Done for today' : 'Up next'} · Day {doneToday ? p.daysDone : day} of {p.days}
            </Text>
            <Text variant="headline" color={t.accent.onAccent}>
              {p.title}
            </Text>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
              <View
                style={{
                  width: `${Math.max(3, (p.daysDone / p.days) * 100)}%`,
                  height: '100%',
                  borderRadius: 5,
                  backgroundColor: t.accent.onAccent,
                }}
              />
            </View>
            <RaisedButton
              kind="white"
              height={50}
              label={doneToday ? 'Read ahead' : `Read day ${day}`}
              onPress={() => router.push({ pathname: '/course/[slug]/[day]', params: { slug: p.slug, day: String(day) } })}
            />
            <Text
              variant="small"
              color={t.accent.onAccent}
              align="center"
              onPress={() => open(p.slug)}
              style={{ fontFamily: 'Nunito_800ExtraBold', textDecorationLine: 'underline' }}>
              See the whole plan
            </Text>
          </RaisedSurface>
        );
      })}

      <View style={{ gap: 10 }}>
        <Text variant="title">Reading plans</Text>
        {available.map((c) => (
          <Card
            key={c.slug}
            onPress={() => open(c.slug)}
            accessibilityLabel={c.title}
            contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: t.radius.tile,
                backgroundColor: c.kind === 'catechism' ? 'rgba(47,164,231,0.15)' : 'rgba(255,107,107,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {c.kind === 'catechism' ? (
                <Text variant="small" color={t.scheme === 'dark' ? '#7CC6F2' : '#1E78B0'} style={{ fontFamily: 'Nunito_900Black' }}>
                  CCC
                </Text>
              ) : (
                <BookIcon />
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                {c.title}
              </Text>
              <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
                {c.summary}
              </Text>
              <Text variant="label" caps color={finished.has(c.slug) ? t.accent.text : t.neutral.textSubtle} style={{ fontSize: 11 }}>
                {finished.has(c.slug) ? 'Finished · ' : ''}
                {c.days} days{c.minutes ? ` · ${c.minutes} min a day` : ''}
              </Text>
            </View>
            <ChevronIcon color={t.neutral.textSubtle} />
          </Card>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: t.radius.button,
          borderWidth: t.border.width,
          borderStyle: 'dashed',
          borderColor: t.neutral.border,
          padding: 14,
        }}>
        <LockIcon color={t.neutral.textSubtle} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }} color={t.neutral.textMuted}>
            The OCIA path
          </Text>
          <Text variant="small" color={t.neutral.textMuted}>
            Bite-size lessons mapped to the rites are on their way.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
