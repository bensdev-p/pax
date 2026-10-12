import { describe, expect, it } from 'vitest';

import { buildProgress, dayStatus, findGraceOffer, graceDaysLeft } from '@/data/streak';
import type { DayActivity } from '@/data/types';
import { monthGrid, shiftMonth, weekdayList } from '@/lib/calendar';

const day = (date: string, marks: Partial<DayActivity> = { read: true }): DayActivity => ({
  date,
  read: false,
  pray: false,
  study: false,
  grace: false,
  ...marks,
});
const run = (first: number, last: number, month = '2026-10') =>
  Array.from({ length: last - first + 1 }, (_, i) => day(`${month}-${String(first + i).padStart(2, '0')}`));

describe('daily rhythm', () => {
  it('calls a day full, partial, grace or missed', () => {
    expect(dayStatus(day('2026-10-01', { read: true, pray: true, study: true }))).toBe('full');
    expect(dayStatus(day('2026-10-01', { pray: true }))).toBe('partial');
    expect(dayStatus(day('2026-10-01', { grace: true }))).toBe('grace');
    expect(dayStatus(undefined)).toBe('missed');
  });

  it('builds today’s marks and counts any one of them for the streak', () => {
    const days = [...run(1, 4), day('2026-10-05', { study: true })];
    const p = buildProgress(days, '2026-10-05', { declinedFor: null });
    expect(p).toMatchObject({ doneToday: true, currentStreak: 5, rhythm: { read: false, pray: false, study: true } });
    expect(p.graceOffer).toBeNull();
  });
});

describe('grace days', () => {
  it('gives two a month, refilled on the 1st', () => {
    const days = [day('2026-09-29', { grace: true }), day('2026-10-03', { grace: true })];
    expect(graceDaysLeft(days, '2026-10-12')).toBe(1);
    expect(graceDaysLeft(days, '2026-11-01')).toBe(2);
  });

  it('offers to cover the missed days before today, keeping the streak', () => {
    // Done Oct 1–9, missed Oct 10 and 11, today is Oct 12.
    const offer = findGraceOffer(run(1, 9), '2026-10-12', null);
    expect(offer).toEqual({ dates: ['2026-10-10', '2026-10-11'], lastActive: '2026-10-09', streak: 11 });
    // Accepting it marks those days as grace; the streak runs through them.
    const accepted = [...run(1, 9), ...offer!.dates.map((d) => day(d, { grace: true }))];
    const p = buildProgress(accepted, '2026-10-12', { declinedFor: null });
    expect(p).toMatchObject({ currentStreak: 11, graceDaysLeft: 0, graceOffer: null });
  });

  it('asks once: no offer after declining for the same gap', () => {
    expect(findGraceOffer(run(1, 9), '2026-10-12', '2026-10-09')).toBeNull();
    // Nothing missed, nothing to offer.
    expect(findGraceOffer([...run(1, 9), ...run(10, 11)], '2026-10-12', null)).toBeNull();
    // Doing something today still leaves the offer open.
    expect(findGraceOffer([...run(1, 9), day('2026-10-12')], '2026-10-12', null)?.streak).toBe(12);
  });

  it('makes no offer when the month has too few left, the gap is long, or the streak was short', () => {
    const usedOne = [day('2026-10-01', { grace: true }), ...run(2, 9)];
    expect(findGraceOffer(usedOne, '2026-10-12', null)).toBeNull(); // needs 2, has 1
    expect(findGraceOffer(usedOne, '2026-10-11', null)?.dates).toEqual(['2026-10-10']);
    expect(findGraceOffer(run(1, 5), '2026-10-12', null)).toBeNull(); // six days missed
    expect(findGraceOffer([day('2026-10-09')], '2026-10-11', null)).toBeNull(); // one-day streak
    expect(findGraceOffer([], '2026-10-11', null)).toBeNull();
  });

  it('counts each missed day against its own month', () => {
    // Done Sep 20–29, missed Sep 30 and Oct 1, today is Oct 2.
    const done = run(20, 29, '2026-09');
    expect(findGraceOffer(done, '2026-10-02', null)?.dates).toEqual(['2026-09-30', '2026-10-01']);
    // September's two already went on Sep 10 and 11: Sep 30 can't be covered.
    const spent = [day('2026-09-10', { grace: true }), day('2026-09-11', { grace: true }), ...done];
    expect(findGraceOffer(spent, '2026-10-02', null)).toBeNull();
  });
});

describe('calendar helpers', () => {
  it('lays out a month in Sunday-first weeks', () => {
    const weeks = monthGrid('2026-10'); // Oct 1, 2026 is a Thursday
    expect(weeks[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
    expect(weeks.at(-1)?.filter(Boolean).at(-1)).toBe('2026-10-31');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('moves between months and names weekdays', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(weekdayList(['2026-10-10', '2026-10-11'])).toBe('Saturday and Sunday');
    expect(weekdayList(['2026-10-09', '2026-10-10', '2026-10-11'])).toBe('Friday, Saturday and Sunday');
  });
});
