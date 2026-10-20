import { mysteriesForDay, type DaySnapshot } from '@pax/liturgy';
import { tokens, type Appearance, type PaletteName } from '@pax/tokens';
import type { Href } from 'expo-router';

import type { PaxMood } from '@/components/Pax';
import type { CourseProgress, DayActivity, NovenaProgress, PrayedToday, ReadingsRead, Rhythm } from '@/data/types';
import { EVENING_HOUR } from '@/lib/examen';
import { MYSTERY_SET_NAMES, paxGreeting, paxMoodFor, shortName } from '@/lib/format';
import { readingsOf, readParts } from '@/lib/readings';
import { prayedRosaryToday, todayChecklist } from '@/lib/today';

/**
 * What the home-screen and Lock Screen widgets show (SPEC: Widgets; look A, chosen with Ben from
 * mockups). The app builds a timeline for each widget, a week ahead, whenever it opens or
 * something is finished; the widgets only draw what they are given (src/widgets/layouts.tsx).
 */

/** Days ahead each timeline covers, so widgets keep turning over while Pax stays closed. */
export const WIDGET_DAYS = 7;

/** Colors for one scheme: the day's accent plus Pax's neutrals. */
export interface WidgetColors {
  accent: string;
  edge: string;
  onAccent: string;
  tint: string;
  /** Accent-colored text on the card. */
  text: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  divider: string;
  ink: string;
  inkMuted: string;
  streak: string;
  streakText: string;
}

interface Themed {
  /** The app's appearance setting: widgets follow it, or the phone when it is "system". */
  scheme: Appearance;
  colors: { light: WidgetColors; dark: WidgetColors };
}

export interface TodayWidgetProps extends Themed {
  /** "TUESDAY" */
  weekday: string;
  /** "Oct 20" */
  dateLabel: string;
  streak: number;
  rhythm: Rhythm;
  /** The marks in the user's rhythm (Study left out when they took it out). */
  marks: (keyof Rhythm)[];
  /** The celebration's name. */
  title: string;
  /** The saint of the day and rank, or the rank. */
  subtitle: string;
  /** One line for the Lock Screen: the saint or the day. */
  inline: string;
  /** The "Today with God" rows (large size). */
  items: { title: string; detail: string; done: boolean; url: string }[];
  pax: { line: string; image: string | null };
  url: string;
}

export interface PrayerWidgetProps extends Themed {
  now: { when: string; title: string; line: string; next: string; url: string };
  rosary: { title: string; detail: string; prayed: boolean; url: string };
}

export interface WordWidgetProps extends Themed {
  label: string;
  text: string;
  source: string;
  url: string;
}

export interface WeekWidgetProps extends Themed {
  /** "ORDINARY TIME · WEEK 29" */
  header: string;
  streak: number;
  /** Monday to Sunday. `done` is null for days still ahead. */
  days: { letter: string; day: number; dot: { light: string; dark: string }; done: boolean | null; today: boolean }[];
  /** The next solemnity: "All Saints · Sunday, Nov 1 · in 12 days". */
  next: string | null;
  url: string;
}

export interface WidgetEntry<P> {
  date: Date;
  props: P;
}

export interface WidgetTimelines {
  today: WidgetEntry<TodayWidgetProps>[];
  prayer: WidgetEntry<PrayerWidgetProps>[];
  word: WidgetEntry<WordWidgetProps>[];
  week: WidgetEntry<WeekWidgetProps>[];
}

/** Today's word as the Today screen shows it (components/WordForToday). */
export interface WidgetWord {
  label: string;
  text: string;
  source: string;
  href: Href;
}

export interface WidgetProgress {
  date: string;
  currentStreak: number;
  doneToday: boolean;
  /** Today's Read · Pray · Study marks. */
  rhythm: Rhythm;
}

export interface WidgetInput {
  now: Date;
  /** Consecutive days from the Monday of this week, reaching at least 60 days past today. */
  snapshots: DaySnapshot[];
  /** daily_activity rows from that Monday to today. */
  activity: DayActivity[];
  progress: WidgetProgress;
  settings: {
    appearance: Appearance;
    lockedColor: PaletteName | null;
    studyInRhythm: boolean;
    prayedToday: PrayedToday | null;
    readingsRead: ReadingsRead | null;
  };
  novenas: NovenaProgress[];
  courses: CourseProgress[];
  /** The saint of the day by date, with the rank chip ("Optional memorial"). */
  saints: Record<string, { name: string; rank: string | null } | null>;
  words: Record<string, WidgetWord | null>;
  /** Pax's pictures in the shared widget folder, by mood. */
  paxImages: Partial<Record<PaxMood, string>>;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "/course/[slug]/[day]" with params → "paxapp://course/bible-in-a-year/12". */
export function hrefUrl(href: Href): string {
  if (typeof href === 'string') return `paxapp://${href.replace(/^\//, '')}`;
  const { pathname, params = {} } = href as { pathname: string; params?: Record<string, unknown> };
  const used = new Set<string>();
  const path = pathname.replace(/\[(\w+)\]/g, (_, key: string) => {
    used.add(key);
    return encodeURIComponent(String(params[key] ?? ''));
  });
  const query = Object.entries(params)
    .filter(([key, value]) => !used.has(key) && value != null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `paxapp://${path.replace(/^\//, '')}${query ? `?${query}` : ''}`;
}

function colorsFor(palette: PaletteName): Themed['colors'] {
  const pick = (scheme: 'light' | 'dark'): WidgetColors => {
    const p = tokens.palettes[palette][scheme];
    const n = tokens.neutral[scheme];
    return {
      ...p,
      surface: n.surface,
      surfaceMuted: n.surfaceMuted,
      border: n.border,
      divider: n.divider,
      ink: n.text,
      inkMuted: n.textMuted,
      streak: tokens.game.streak,
      streakText: tokens.game.streakText,
    };
  };
  return { light: pick('light'), dark: pick('dark') };
}

function themed(day: DaySnapshot, settings: WidgetInput['settings']): Themed {
  const palette = settings.lockedColor ?? (day.color in tokens.palettes ? (day.color as PaletteName) : 'green');
  return { scheme: settings.appearance, colors: colorsFor(palette) };
}

function lastIndexWhere<T>(list: T[], test: (item: T) => boolean): number {
  for (let i = list.length - 1; i >= 0; i--) if (test(list[i]!)) return i;
  return -1;
}

/** Local midnight plus `hour` on a YYYY-MM-DD date. */
export function localTime(date: string, hour = 0): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, hour);
}

function addDays(date: string, n: number): string {
  const t = localTime(date);
  t.setDate(t.getDate() + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/**
 * Entries for each of the next days at the given hours. The slot already under way starts now,
 * so the widget changes as soon as it is written; earlier slots are dropped.
 */
function slots<P>(days: DaySnapshot[], hours: number[], now: Date, build: (day: DaySnapshot, hour: number) => P): WidgetEntry<P>[] {
  const all = days.flatMap((day) => hours.map((hour) => ({ day, hour, at: localTime(day.date, hour) })));
  const current = lastIndexWhere(all, (s) => s.at.getTime() <= now.getTime());
  return all.slice(Math.max(0, current)).map((s, i) => ({
    date: i === 0 && current >= 0 ? now : s.at,
    props: build(s.day, s.hour),
  }));
}

/** The prayer the Prayer widget offers at each hour of the day, and when the next one starts. */
export function prayerForHour(day: Pick<DaySnapshot, 'season'>, hour: number): PrayerWidgetProps['now'] {
  const easter = day.season === 'EASTER_TIME';
  const noon = easter
    ? { title: 'Regina Caeli', line: 'Queen of Heaven, rejoice, alleluia.', url: 'paxapp://prayer/regina-caeli' }
    : { title: 'The Angelus', line: 'The Angel of the Lord declared unto Mary.', url: 'paxapp://prayer/angelus' };
  const night = {
    title: 'Hail, Holy Queen',
    line: 'Hail, holy Queen, Mother of mercy, our life, our sweetness and our hope.',
    url: 'paxapp://prayer/hail-holy-queen',
  };
  const hours = [
    { from: 0, when: 'Night', ...night },
    {
      from: 5,
      when: 'Morning',
      title: 'Morning Offering',
      line: 'O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys, and sufferings of this day.',
      url: 'paxapp://prayer/morning-offering',
    },
    { from: 12, when: 'Noon', ...noon },
    {
      from: 15,
      when: 'Afternoon',
      title: 'Divine Mercy Chaplet',
      line: 'The hour of mercy: mercy for us and the whole world, on rosary beads.',
      url: 'paxapp://devotion/divine-mercy-chaplet',
    },
    {
      from: EVENING_HOUR,
      when: 'Evening',
      title: 'The Examen',
      line: 'Five minutes to look back on the day with God.',
      url: 'paxapp://examen',
    },
    { from: 22, when: 'Night', ...night },
  ];
  const i = lastIndexWhere(hours, (h) => h.from <= hour);
  const { when, title, line, url } = hours[i]!;
  const next = hours[i + 1] ?? hours[1]!;
  return { when, title, line, url, next: `Next: ${next.title} at ${clock(next.from)}` };
}

export const PRAYER_HOURS = [0, 5, 12, 15, EVENING_HOUR, 22];

function clock(hour: number): string {
  if (hour === 12) return 'noon';
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** "Sunday, Nov 1 · in 12 days" */
function whenLabel(date: string, from: string): string {
  const day = localTime(date);
  const n = Math.round((day.getTime() - localTime(from).getTime()) / 86_400_000);
  const away = n === 1 ? 'tomorrow' : `in ${n} days`;
  return `${WEEKDAYS[day.getDay()]}, ${MONTHS[day.getMonth()]} ${day.getDate()} · ${away}`;
}

/** Builds every widget's timeline from today's state. Pure, so it is tested (test/widgets.test.ts). */
export function buildWidgetTimelines(input: WidgetInput): WidgetTimelines {
  const { now, progress, settings } = input;
  const today = progress.date;
  const startIndex = input.snapshots.findIndex((s) => s.date === today);
  const days = input.snapshots.slice(startIndex, startIndex + WIDGET_DAYS);
  const isToday = (day: DaySnapshot) => day.date === today;
  const rhythmOn = (day: DaySnapshot): Rhythm => (isToday(day) ? progress.rhythm : { read: false, pray: false, study: false });

  const todayEntries = slots(days, [0, 7, EVENING_HOUR, 22], now, (day, hour) => {
    const doneToday = isToday(day) && progress.doneToday;
    const saint = input.saints[day.date];
    const items = todayChecklist({
      date: day.date,
      rhythm: rhythmOn(day),
      readings: readingsOf(day),
      readParts: isToday(day) ? readParts(settings, day.date) : [],
      mysteries: MYSTERY_SET_NAMES[mysteriesForDay(day)],
      prayed: isToday(day) ? settings.prayedToday : null,
      novenas: input.novenas,
      courses: input.courses,
      studyInRhythm: settings.studyInRhythm,
      hour,
    });
    const [, m, d] = day.date.split('-').map(Number) as [number, number, number];
    return {
      ...themed(day, settings),
      weekday: WEEKDAYS[day.dayOfWeek]!.toUpperCase(),
      dateLabel: `${MONTHS[m - 1]} ${d}`,
      streak: progress.currentStreak,
      rhythm: rhythmOn(day),
      marks: items.map((item) => item.mark),
      title: day.name,
      subtitle: saint && saint.name !== day.name ? [saint.name, saint.rank].filter(Boolean).join(' · ') : day.rankName,
      inline: shortName(saint?.name ?? day.name),
      items: items.map((item) => ({ title: item.title, detail: item.detail, done: item.done, url: hrefUrl(item.href) })),
      pax: {
        line: paxGreeting(day, { doneToday, hour }),
        image: input.paxImages[paxMoodFor({ doneToday, hour })] ?? null,
      },
      url: 'paxapp://today',
    };
  });

  const prayerEntries = slots(days, PRAYER_HOURS, now, (day, hour) => {
    const prayed = isToday(day) && prayedRosaryToday(settings.prayedToday, day.date);
    return {
      ...themed(day, settings),
      now: prayerForHour(day, hour),
      rosary: {
        title: `${MYSTERY_SET_NAMES[mysteriesForDay(day)]} Mysteries`,
        detail: prayed ? 'Prayed today' : 'Today’s Rosary',
        prayed,
        url: 'paxapp://rosary',
      },
    };
  });

  const wordEntries = slots(
    days.filter((day) => input.words[day.date]),
    [0],
    now,
    (day) => {
      const word = input.words[day.date]!;
      return { ...themed(day, settings), label: word.label, text: word.text, source: word.source, url: hrefUrl(word.href) };
    },
  );

  const doneOn = new Map(input.activity.map((a) => [a.date, a.read || a.pray || a.study || a.grace]));
  doneOn.set(today, progress.doneToday);
  const weekEntries = slots(days, [0], now, (day) => {
    const index = input.snapshots.findIndex((s) => s.date === day.date);
    const monday = index - ((day.dayOfWeek + 6) % 7);
    const week = input.snapshots.slice(Math.max(0, monday), monday + 7);
    const next = input.snapshots.slice(index + 1).find((s) => s.rank === 'SOLEMNITY');
    return {
      ...themed(day, settings),
      header: (day.season === 'PASCHAL_TRIDUUM' ? day.seasonName : `${day.seasonName} · Week ${day.weekOfSeason}`).toUpperCase(),
      streak: progress.currentStreak,
      days: week.map((s) => ({
        letter: WEEKDAYS[s.dayOfWeek]!.charAt(0),
        day: Number(s.date.slice(8)),
        dot: { light: tokens.palettes[s.color].light.accent, dark: tokens.palettes[s.color].dark.accent },
        done: s.date <= today ? (doneOn.get(s.date) ?? false) : null,
        today: s.date === day.date,
      })),
      next: next ? `${shortName(next.name)} · ${whenLabel(next.date, day.date)}` : null,
      url: 'paxapp://today',
    };
  });

  return { today: todayEntries, prayer: prayerEntries, word: wordEntries, week: weekEntries };
}

/** The Monday on or before `date`. */
export function mondayOf(date: string): string {
  const back = (localTime(date).getDay() + 6) % 7;
  return addDays(date, -back);
}

/** Where the timelines go. On iOS, expo-widgets (widgets/writer.ios.ts); elsewhere nowhere. */
export interface WidgetFeedWriter {
  write(timelines: WidgetTimelines): Promise<void>;
}

export const noopWidgetFeedWriter: WidgetFeedWriter = {
  async write() {},
};

let writer: WidgetFeedWriter = noopWidgetFeedWriter;
let lastTimelines: WidgetTimelines | null = null;

export function setWidgetFeedWriter(next: WidgetFeedWriter) {
  writer = next;
}

/** For debugging: the last timelines that were written (or would have been, in Expo Go). */
export function getLastWidgetTimelines() {
  return lastTimelines;
}

export async function writeWidgetFeed(input: WidgetInput): Promise<WidgetTimelines> {
  const timelines = buildWidgetTimelines(input);
  lastTimelines = timelines;
  await writer.write(timelines);
  return timelines;
}
