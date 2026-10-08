import type { DaySnapshot } from '@pax/liturgy';

import type { CourseProgress, NotificationPrefs, NovenaProgress } from '@/data/types';

/**
 * Which local notifications to schedule, as plain data (no Expo imports, so it is testable).
 *
 * - Morning and evening reminders at the user's own times.
 * - Built-in nudges at fixed times, only on days nothing is done yet (SPEC: streak at risk).
 * - The Angelus at noon, every day, when switched on.
 * - A daily reminder for each novena or reading plan in progress that has one, until its last
 *   day; skipped on a day it was already done.
 *
 * Once today counts (a lesson, the readings or a prayer), today's reminders and nudges are
 * dropped; the app reschedules whenever something is finished. iOS keeps at most 64 pending
 * notifications per app, so the plan stops at MAX_PENDING, earliest first (SPEC rule 1).
 */
export const NUDGE_TIMES = ['13:00', '17:30', '21:00'] as const;
export const MAX_PENDING = 60;
/** A nudge this close to the user's own reminder is skipped so Pax doesn't double up. */
const NUDGE_GAP_MINUTES = 45;

export type NotificationKind = 'morning_reminder' | 'evening_reminder' | 'streak_nudge' | 'angelus' | 'novena' | 'course';

/** A novena or reading plan with its own daily reminder. */
export interface DailyReminder {
  kind: 'novena' | 'course';
  slug: string;
  title: string;
  /** Days in the novena (9) or plan. */
  total: number;
  daysDone: number;
  lastDoneOn: string | null;
  reminderTime: string | null;
}

export const novenaReminder = (n: NovenaProgress): DailyReminder => ({
  kind: 'novena',
  slug: n.slug,
  title: n.title,
  total: 9,
  daysDone: n.daysDone,
  lastDoneOn: n.lastPrayedOn,
  reminderTime: n.reminderTime,
});

export const courseReminder = (c: CourseProgress): DailyReminder => ({
  kind: 'course',
  slug: c.slug,
  title: c.title,
  total: c.days,
  daysDone: c.daysDone,
  lastDoneOn: c.lastDoneOn,
  reminderTime: c.reminderTime,
});


export interface PlannedNotification {
  kind: NotificationKind;
  date: string;
  time: string;
  at: Date;
  title: string;
  body: string;
  url: string;
}

export function planNotifications(
  prefs: NotificationPrefs,
  days: DaySnapshot[],
  opts: { now: Date; today: string; doneToday: boolean; daily?: DailyReminder[] },
): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  for (const item of opts.daily ?? []) {
    if (!item.reminderTime) continue;
    // Day numbers still to do, one a day, starting today or, if today's is done, tomorrow.
    const remaining = item.total - item.daysDone;
    const first = item.lastDoneOn === opts.today ? 1 : 0;
    days.slice(first, first + remaining).forEach((day, i) => {
      const number = item.daysDone + i + 1;
      const last = number === item.total;
      const novena = item.kind === 'novena';
      plan.push({
        kind: item.kind,
        date: day.date,
        time: item.reminderTime!,
        at: localDate(day.date, item.reminderTime!),
        title: `${item.title} · Day ${number}`,
        body: novena
          ? last
            ? 'The last day of your novena. Pray it with me?'
            : 'Your novena prayer for today is ready.'
          : last
            ? 'The last day of your plan. Let’s finish it together!'
            : 'Today’s reading is ready when you are.',
        url: novena ? `paxapp://devotion/${item.slug}` : `paxapp://course/${item.slug}`,
      });
    });
  }
  for (const day of days.slice(0, 14)) {
    const done = day.date === opts.today && opts.doneToday;
    const add = (kind: NotificationKind, time: string, copy: { title: string; body: string }, url = 'paxapp://today') =>
      plan.push({ kind, date: day.date, time, at: localDate(day.date, time), url, ...copy });

    if (prefs.morning.enabled && !done) add('morning_reminder', prefs.morning.time, morningCopy(day));
    if (prefs.evening.enabled && !done) add('evening_reminder', prefs.evening.time, eveningCopy(day));
    if (prefs.angelus) {
      add('angelus', '12:00', {
        title: 'The Angelus',
        body: 'The Angel of the Lord declared unto Mary… Pray it with me?',
      }, 'paxapp://prayer/angelus');
    }
    if (prefs.nudges && !done) {
      const own = [prefs.morning, prefs.evening].filter((r) => r.enabled).map((r) => minutes(r.time));
      NUDGE_TIMES.forEach((time, i) => {
        if (own.some((m) => Math.abs(m - minutes(time)) < NUDGE_GAP_MINUTES)) return;
        add('streak_nudge', time, nudgeCopy(day, i));
      });
    }
  }
  return plan
    .filter((n) => n.at.getTime() > opts.now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_PENDING);
}

function morningCopy(day: DaySnapshot) {
  return isFeast(day)
    ? { title: `Good morning! It’s ${day.name}`, body: 'Two minutes with today’s readings? I saved you a spot.' }
    : { title: 'Good morning from Pax', body: `It’s ${day.seasonName}. Two minutes with today’s readings?` };
}

function eveningCopy(day: DaySnapshot) {
  return isFeast(day)
    ? { title: 'Still time today', body: `Today the Church celebrates ${day.name}. A short prayer before bed?` }
    : { title: 'Still time today', body: 'A decade of the Rosary or today’s Gospel. I’ll keep you company.' };
}

/** Warm, never guilt-driven (SPEC rule 3). The last one is the sleepy night nudge. */
function nudgeCopy(day: DaySnapshot, index: number) {
  switch (index) {
    case 0:
      return { title: 'A quiet minute?', body: `Today’s Gospel is short. ${day.readings?.gospel ?? 'Read it with me'}.` };
    case 1:
      return { title: 'Pax is saving your spot', body: 'One reading or one prayer keeps your streak going today.' };
    default:
      return { title: 'Before I tuck in…', body: 'There’s still time for today’s readings or a decade of the Rosary. Goodnight!' };
  }
}

function isFeast(day: DaySnapshot) {
  return day.rank === 'SOLEMNITY' || day.rank === 'FEAST' || day.rank === 'MEMORIAL';
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

export function localDate(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = hhmm.split(':').map(Number) as [number, number];
  return new Date(y, mo - 1, d, hh, mm);
}

/** "20:00" → "8:00 PM". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}
