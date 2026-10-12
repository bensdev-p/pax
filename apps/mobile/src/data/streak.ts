import { addDays } from '@pax/liturgy';

import { GRACE_DAYS_PER_MONTH, type DayActivity, type GraceOffer, type Progress, type Rhythm } from './types';

/**
 * Streaks count consecutive local dates with any activity (SPEC: Data model rule 4). Today
 * not being done yet does not break the streak; it ends at yesterday instead. Dates covered by
 * a grace day count as active.
 */
export function computeStreak(activeDates: Iterable<string>, today: string): { current: number; longest: number } {
  const set = new Set(activeDates);
  let current = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  for (const date of set) {
    if (set.has(addDays(date, -1))) continue; // not the start of a run
    let run = 0;
    let d = date;
    while (set.has(d)) {
      run++;
      d = addDays(d, 1);
    }
    longest = Math.max(longest, run);
  }
  return { current, longest: Math.max(longest, current) };
}

/** A day counts for the streak when any one of Read, Pray or Study was done, or grace covered it. */
export function isActive(day: DayActivity | undefined): boolean {
  return !!day && (day.read || day.pray || day.study || day.grace);
}

export type DayStatus = 'full' | 'partial' | 'grace' | 'missed';

/** Full: all three marks. Partial: one or two. Grace: missed but covered by a grace day. */
export function dayStatus(day: DayActivity | undefined): DayStatus {
  if (!day) return 'missed';
  const marks = Number(day.read) + Number(day.pray) + Number(day.study);
  if (marks === 3) return 'full';
  if (marks > 0) return 'partial';
  return day.grace ? 'grace' : 'missed';
}

export function rhythmOf(day: DayActivity | undefined): Rhythm {
  return { read: !!day?.read, pray: !!day?.pray, study: !!day?.study };
}

/** Grace days still free in the month of `date` (two a month, refilled on the 1st, no carryover). */
export function graceDaysLeft(days: DayActivity[], date: string): number {
  const month = date.slice(0, 7);
  const used = days.filter((d) => d.grace && d.date.startsWith(month)).length;
  return Math.max(0, GRACE_DAYS_PER_MONTH - used);
}

/** A streak shorter than this isn't worth asking about. */
const MIN_STREAK_TO_OFFER = 2;

/**
 * Pax asks before using grace days (decided with Ben). When the days right before today were
 * missed, the streak before them was at least two days long, and each missed day's month still
 * has a grace day for it, this returns the offer; otherwise null. `declinedFor` is the last
 * active date of a streak the user already chose to let go, so Pax asks only once per gap.
 */
export function findGraceOffer(days: DayActivity[], today: string, declinedFor: string | null): GraceOffer | null {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const gap: string[] = [];
  let cursor = addDays(today, -1);
  // Two a month means at most four in a row (across a month boundary).
  while (!isActive(byDate.get(cursor))) {
    gap.unshift(cursor);
    if (gap.length > GRACE_DAYS_PER_MONTH * 2) return null;
    cursor = addDays(cursor, -1);
  }
  if (gap.length === 0 || cursor === declinedFor) return null;

  const active = days.filter(isActive).map((d) => d.date);
  const before = computeStreak(active, cursor).current;
  if (before < MIN_STREAK_TO_OFFER) return null;

  const needed = new Map<string, number>();
  for (const date of gap) needed.set(date.slice(0, 7), (needed.get(date.slice(0, 7)) ?? 0) + 1);
  for (const [month, n] of needed) {
    if (n > graceDaysLeft(days, `${month}-01`)) return null;
  }
  const kept = computeStreak([...active, ...gap], today).current;
  return { dates: gap, lastActive: cursor, streak: kept };
}

/** Progress from every day of activity (both stores share this). */
export function buildProgress(
  days: DayActivity[],
  today: string,
  opts: { declinedFor: string | null; storedLongest?: number },
): Progress {
  const todayRow = days.find((d) => d.date === today);
  const { current, longest } = computeStreak(days.filter(isActive).map((d) => d.date), today);
  return {
    today,
    doneToday: isActive(todayRow),
    rhythm: rhythmOf(todayRow),
    currentStreak: current,
    longestStreak: Math.max(longest, opts.storedLongest ?? 0),
    graceDaysLeft: graceDaysLeft(days, today),
    graceOffer: findGraceOffer(days, today, opts.declinedFor),
  };
}
