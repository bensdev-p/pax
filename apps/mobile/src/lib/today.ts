import type { Href } from 'expo-router';

import type { CourseProgress, NovenaProgress, PrayedToday, Rhythm } from '@/data/types';

import { isFinished, nextDay } from './courses';
import { NOVENA_DAYS } from './devotions';

/** One row of the "Today with God" card (SPEC: Today, item 3). */
export interface ChecklistItem {
  mark: keyof Rhythm;
  title: string;
  detail: string;
  done: boolean;
  href: Href;
  /** Nothing to do yet (no plan started): shown quieter. */
  optional?: boolean;
}

/** Prayers finished today (a new day starts empty). */
export function prayersToday(prayed: PrayedToday | null, date: string): PrayedToday['prayers'] {
  return prayed?.date === date ? prayed.prayers : [];
}

export function prayedRosaryToday(prayed: PrayedToday | null, date: string): boolean {
  return prayersToday(prayed, date).some((p) => p.slug === 'rosary');
}

/**
 * Read: today's readings. Pray: a novena day if one is in progress and not yet prayed today,
 * otherwise the Rosary with today's mysteries. Study: the next day of a plan in progress.
 * Each row checks off with its Read · Pray · Study mark, and says what was actually done.
 */
export function todayChecklist(input: {
  date: string;
  rhythm: Rhythm;
  readings: { part: string; label: string; citation: string }[];
  readParts: string[];
  mysteries: string;
  prayed: PrayedToday | null;
  novenas: NovenaProgress[];
  courses: CourseProgress[];
}): ChecklistItem[] {
  const { date, rhythm } = input;

  const gospel = input.readings.find((r) => r.part === 'gospel');
  const readCount = input.readings.filter((r) => input.readParts.includes(r.part)).length;
  const read: ChecklistItem = {
    mark: 'read',
    title: 'Today’s readings',
    detail: rhythm.read
      ? 'Read'
      : readCount
        ? `${readCount} of ${input.readings.length} read`
        : gospel
          ? `Gospel · ${gospel.citation}`
          : 'Full texts on USCCB.org',
    done: rhythm.read,
    href: '/readings',
  };

  const prayers = prayersToday(input.prayed, date);
  const novenas = input.novenas.filter((n) => n.daysDone < NOVENA_DAYS || n.lastPrayedOn === date);
  const waiting = novenas.find((n) => n.lastPrayedOn !== date && n.daysDone < NOVENA_DAYS);
  const novenaHref = (slug: string): Href => ({ pathname: '/devotion/[slug]/pray', params: { slug } });
  let pray: ChecklistItem;
  if (!rhythm.pray) {
    pray = waiting
      ? { mark: 'pray', title: waiting.title, detail: `Day ${waiting.daysDone + 1} of ${NOVENA_DAYS}`, done: false, href: novenaHref(waiting.slug) }
      : { mark: 'pray', title: 'The Rosary', detail: `${input.mysteries} Mysteries`, done: false, href: '/rosary' };
  } else {
    // Name what was actually prayed (the Rosary only if it was the Rosary).
    const names = prayers.length ? prayers.map((p) => p.title) : novenas.filter((n) => n.lastPrayedOn === date).map((n) => n.title);
    pray = {
      mark: 'pray',
      title: names[0] ?? 'Prayed today',
      detail: waiting
        ? `Next: ${waiting.title}, day ${waiting.daysDone + 1}`
        : names.length > 1
          ? `Also ${names.slice(1).join(' · ')}`
          : 'Prayed today',
      done: true,
      href: waiting ? novenaHref(waiting.slug) : '/pray',
    };
  }

  const doneToday = input.courses.find((c) => c.lastDoneOn === date);
  const next = input.courses.find((c) => !isFinished(c));
  let study: ChecklistItem;
  if (doneToday) {
    study = {
      mark: 'study',
      title: doneToday.title,
      detail: `Day ${doneToday.daysDone} read`,
      done: true,
      href: { pathname: '/course/[slug]', params: { slug: doneToday.slug } },
    };
  } else if (next) {
    study = {
      mark: 'study',
      title: next.title,
      detail: `Day ${nextDay(next)} of ${next.days}`,
      done: rhythm.study,
      href: { pathname: '/course/[slug]/[day]', params: { slug: next.slug, day: String(nextDay(next)) } },
    };
  } else {
    study = {
      mark: 'study',
      title: 'Start a reading plan',
      detail: 'Bible in a Year, the Psalms, Mark…',
      done: rhythm.study,
      href: '/study',
      optional: true,
    };
  }

  return [read, pray, study];
}
