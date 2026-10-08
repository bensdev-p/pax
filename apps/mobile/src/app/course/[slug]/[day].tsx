import { toIsoDate } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FatherCard } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { CheckIcon, ChevronIcon } from '@/components/Icons';
import { Chip, SectionLabel } from '@/components/LibraryBits';
import { Passage, type PassageVerse } from '@/components/Passage';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent, useLibrary } from '@/data/content';
import { verseLabel, type CccParagraph, type FatherExcerpt, type LibraryStore, type VerseDetail } from '@/data/library';
import type { Course, CourseDay, CourseUnit } from '@/data/types';
import { afterReading, COURSE_DAY_XP, startCourse } from '@/lib/courses';
import { openVerse } from '@/lib/libraryLinks';
import { useAppState } from '@/state/AppState';

/** Pre-renders every day of every plan for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string; day: string }[]> {
  const data = require('../../../../assets/content/content.json') as { courses: Record<string, number> };
  return Object.entries(data.courses).flatMap(([slug, days]) =>
    Array.from({ length: days }, (_, i) => ({ slug, day: String(i + 1) })),
  );
}

interface Section {
  heading: string;
  verses: PassageVerse[];
}

/** The Douay text of a day's chapters (or parts of chapters), one block per chapter. */
async function loadText(library: LibraryStore, units: CourseUnit[]): Promise<Section[]> {
  const out: Section[] = [];
  for (const u of units) {
    const view = await library.chapter(u.book, u.chapter);
    if (!view) continue;
    const verses = view.verses.filter((v) => (u.from ? v.douay_verse >= u.from && v.douay_verse <= (u.to ?? u.from) : true));
    const name = view.book.osis === 'Ps' ? 'Psalm' : view.book.name;
    const modern = view.book.osis === 'Ps' && verses[0] && verses[0].chapter !== u.chapter ? ` (${verses[0].chapter})` : '';
    const range = u.from ? `:${u.from}–${u.to}` : '';
    out.push({ heading: u.chapter === 0 ? `${name}, prologue` : `${name} ${u.chapter}${modern}${range}`, verses });
  }
  return out;
}

/**
 * One day of a reading plan. Bible plans show the day's chapters in full, then the day's Psalm
 * or Proverbs and a word from the Fathers; the Catechism plan shows Pax's summary, the day's
 * paragraphs and the Scripture they cite, with a link to the full text on vatican.va.
 */
export default function CourseDayScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug: string; day: string }>();
  const slug = String(params.slug);
  const dayNumber = Number(params.day);
  const content = useContent();
  const library = useLibrary();
  const { courses, saveCourse, recordActivity } = useAppState();
  const [course, setCourse] = useState<Course | null>(null);
  const [day, setDay] = useState<CourseDay | null | undefined>(undefined);
  const [text, setText] = useState<Section[]>([]);
  const [wisdom, setWisdom] = useState<Section[]>([]);
  const [father, setFather] = useState<{ excerpt: FatherExcerpt; ref: string } | null>(null);
  const [paragraphs, setParagraphs] = useState<CccParagraph[]>([]);
  const [cited, setCited] = useState<VerseDetail[]>([]);
  // Which day was just finished here; replacing the route with the next day clears it.
  const [finishedDay, setFinishedDay] = useState<string | null>(null);
  const today = toIsoDate(new Date());

  useEffect(() => {
    void content.course(slug).then(setCourse);
    void content.courseDay(slug, dayNumber).then(setDay);
  }, [content, slug, dayNumber]);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    void (async () => {
      if (day.readings.length) {
        const main = await loadText(library, day.readings);
        if (cancelled) return;
        setText(main);
        setWisdom(await loadText(library, day.wisdom));
        // A word from the Fathers on one of the first verses of the day.
        for (const v of main[0]?.verses.slice(0, 8) ?? []) {
          const found = await library.fathersForVerse(v.ref);
          if (found[0]) {
            const detail = await library.verse(v.ref);
            if (!cancelled) setFather({ excerpt: found[0], ref: detail ? verseLabel(detail) : '' });
            break;
          }
        }
      }
      if (day.ccc_first && day.ccc_last) {
        const list: CccParagraph[] = [];
        const verses = new Map<string, VerseDetail>();
        for (let n = day.ccc_first; n <= day.ccc_last; n++) {
          const p = await library.ccc(n);
          if (p) list.push(p);
          for (const v of await library.cccVerses(n)) verses.set(v.ref, v);
        }
        if (cancelled) return;
        setParagraphs(list);
        setCited([...verses.values()].slice(0, 10));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [library, day]);

  if (day === null) {
    return (
      <Screen header={<Header title="Not found" />}>
        <Text variant="body">This day isn’t in the plan.</Text>
      </Screen>
    );
  }
  if (!day || !course) return <Screen header={<Header title="" />}>{null}</Screen>;

  const justDone = finishedDay === `${slug}/${dayNumber}`;
  const progress = courses.find((c) => c.slug === slug);
  const done = !!progress && dayNumber <= progress.daysDone;
  const isNext = !progress ? dayNumber === 1 : dayNumber === progress.daysDone + 1;
  const hasNext = dayNumber < course.days;
  const goTo = (n: number) => router.replace({ pathname: '/course/[slug]/[day]', params: { slug, day: String(n) } });

  const finish = async () => {
    const base = progress ?? startCourse(course, today);
    await saveCourse(slug, afterReading(base, dayNumber, today));
    await recordActivity('lesson', COURSE_DAY_XP);
    setFinishedDay(`${slug}/${dayNumber}`);
  };

  // Paragraph headings, grouped so a run of paragraphs under one heading shows once.
  const headingGroups: { heading: string; first: number; last: number }[] = [];
  for (const p of paragraphs) {
    const last = headingGroups[headingGroups.length - 1];
    if (last && last.heading === p.heading) last.last = p.number;
    else headingGroups.push({ heading: p.heading, first: p.number, last: p.number });
  }

  return (
    <Screen
      header={<Header title={`Day ${dayNumber}`} subtitle={course.title} />}
      footer={
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, gap: 8 }}>
          {justDone ? (
            <>
              <Text variant="bodyStrong" align="center" color={t.accent.text}>
                Day {dayNumber} done · +{COURSE_DAY_XP} XP
              </Text>
              <RaisedButton
                kind={hasNext ? 'neutral' : 'accent'}
                label={hasNext ? `Read ahead: day ${dayNumber + 1}` : 'Back to the plan'}
                onPress={() => (hasNext ? goTo(dayNumber + 1) : router.back())}
              />
            </>
          ) : done ? (
            <RaisedButton kind="neutral" label="Already read" icon={<CheckIcon color={t.neutral.textMuted} />} onPress={() => router.back()} />
          ) : isNext ? (
            <RaisedButton label={`Done · Day ${dayNumber}`} onPress={() => void finish()} />
          ) : (
            <RaisedButton
              kind="neutral"
              label={`Read day ${progress ? progress.daysDone + 1 : 1} first`}
              onPress={() => goTo(progress ? progress.daysDone + 1 : 1)}
            />
          )}
        </View>
      }>
      {day.section ? <SectionLabel>{day.section}</SectionLabel> : null}
      <Text variant="display" accessibilityRole="header">
        {day.title}
      </Text>
      <Text variant="label" caps color={t.accent.text}>
        {day.label}
        {day.wisdom_label ? ` · ${day.wisdom_label}` : ''}
      </Text>

      {day.intro || day.summary ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Pax mood="hint" size={56} shadow={false} />
          <View
            style={{
              flex: 1,
              borderWidth: t.border.width,
              borderColor: t.neutral.border,
              borderRadius: t.radius.button,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}>
            <Text variant="body" style={day.summary ? { fontSize: 16, lineHeight: 23 } : undefined}>
              {day.summary ?? day.intro}
            </Text>
          </View>
        </View>
      ) : null}

      {text.map((s) => (
        <Passage key={s.heading} heading={s.heading} verses={s.verses} />
      ))}

      {wisdom.length ? (
        <Card tinted radius={t.radius.card} contentStyle={{ padding: 16, gap: 10 }}>
          <Text variant="label" caps color={t.accent.text}>
            Pray with today’s {day.wisdom[0]?.book === 'Prov' ? 'Proverbs' : 'Psalm'}
          </Text>
          {wisdom.map((s) => (
            <Passage key={s.heading} heading={s.heading} verses={s.verses} />
          ))}
        </Card>
      ) : null}

      {headingGroups.length ? (
        <View style={{ gap: 4 }}>
          <SectionLabel>Today’s paragraphs</SectionLabel>
          {headingGroups.map((g) => (
            <Pressable
              key={`${g.first}`}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/ccc/[number]', params: { number: String(g.first) } })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text variant="label" color={t.accent.text} style={{ width: 76 }}>
                CCC {g.first}
                {g.last > g.first ? `–${g.last}` : ''}
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {tidyHeading(g.heading)}
              </Text>
              <ChevronIcon size={18} color={t.neutral.textSubtle} />
            </Pressable>
          ))}
          {paragraphs[0] ? (
            <RaisedButton
              kind="neutral"
              height={46}
              label={`Read CCC ${day.ccc_first}–${day.ccc_last} on vatican.va`}
              onPress={() => void WebBrowser.openBrowserAsync(paragraphs[0]!.vatican_url)}
            />
          ) : null}
        </View>
      ) : null}

      {cited.length ? (
        <View style={{ gap: 8 }}>
          <SectionLabel>Scripture these paragraphs cite</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {cited.map((v) => (
              <Chip key={v.ref} label={verseLabel(v)} onPress={() => openVerse(v.ref)} />
            ))}
          </View>
        </View>
      ) : null}

      {father ? (
        <View style={{ gap: 8 }}>
          <SectionLabel>From the Fathers</SectionLabel>
          <FatherCard excerpt={father.excerpt} showRef={father.ref} />
        </View>
      ) : null}

      {day.see.length ? (
        <View style={{ gap: 8 }}>
          <SectionLabel>Meet them in the Library</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {day.see.map((s) => (
              <Chip
                key={`${s.kind}-${s.key}`}
                label={s.label}
                onPress={() =>
                  s.kind === 'saint'
                    ? router.push({ pathname: '/saint/[key]', params: { key: s.key } })
                    : router.push({ pathname: '/fathers/[author]', params: { author: s.key, name: s.label } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {day.question ? (
        <View style={{ borderWidth: t.border.width, borderColor: t.neutral.border, borderRadius: t.radius.button, padding: 12, gap: 2 }}>
          <Text variant="label" caps color={t.neutral.textMuted}>
            Pax asks
          </Text>
          <Text variant="body">{day.question}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

/** Headings in the scraped index are sometimes upper case; soften them for reading. */
function tidyHeading(h: string): string {
  return h === h.toUpperCase() ? h.charAt(0) + h.slice(1).toLowerCase() : h;
}
