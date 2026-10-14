import { describe, expect, it } from 'vitest';

import { buildProgress, dayStatus, findGraceOffer, graceDaysLeft } from '@/data/streak';
import type { DayActivity } from '@/data/types';
import { monthGrid, shiftMonth, weekdayList } from '@/lib/calendar';
import { DAILY_WORDS, dailyWordFor, workTitle } from '@/lib/dailyWord';
import { defaultTags, journalView, makeNote, newId, normalizeTag, tagsFrom } from '@/lib/notes';
import { needsOnboarding, suggestedPlan } from '@/lib/onboarding';
import { prayedRosaryToday, todayChecklist } from '@/lib/today';

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
    // Without Study in the rhythm, Read and Pray make a full day.
    expect(dayStatus(day('2026-10-01', { read: true, pray: true }), false)).toBe('full');
    expect(dayStatus(day('2026-10-01', { read: true, pray: true }))).toBe('partial');
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

describe('Today with God checklist', () => {
  const base = {
    date: '2026-10-12',
    rhythm: { read: false, pray: false, study: false },
    readings: [
      { part: 'firstReading', label: 'First reading', citation: 'Gal 4:22–24' },
      { part: 'gospel', label: 'Gospel', citation: 'Luke 11:29–32' },
    ],
    readParts: [] as string[],
    mysteries: 'Joyful',
    prayed: null,
    novenas: [],
    courses: [],
    studyInRhythm: true,
  };
  const novena = { slug: 'novena-st-joseph', title: 'Novena to Saint Joseph', startedOn: '2026-10-09', daysDone: 3, lastPrayedOn: '2026-10-11', reminderTime: null };
  const plan = { slug: 'mark-in-16-days', title: 'Mark in 16 Days', days: 16, startedOn: '2026-10-01', daysDone: 4, lastDoneOn: '2026-10-11', reminderTime: null };

  it('suggests the readings, the Pray tab and starting a plan on a fresh day', () => {
    const [read, pray, study] = todayChecklist(base);
    expect(read).toMatchObject({ title: 'Today’s readings', detail: 'Gospel · Luke 11:29–32', done: false });
    expect(pray).toMatchObject({ title: 'Time to pray', detail: 'The Rosary today: Joyful Mysteries', href: '/pray' });
    expect(study).toMatchObject({ title: 'Start a reading plan', optional: true });
  });

  it('suggests the Examen from the evening, unless a novena day is waiting', () => {
    expect(todayChecklist({ ...base, hour: 17 })[1]).toMatchObject({ title: 'Time to pray' });
    expect(todayChecklist({ ...base, hour: 18 })[1]).toMatchObject({ title: 'The Examen', href: '/examen', done: false });
    expect(todayChecklist({ ...base, hour: 21, novenas: [novena] })[1]).toMatchObject({ title: 'Novena to Saint Joseph' });
  });

  it('leaves Study out when the user took it out, unless a plan is in progress', () => {
    expect(todayChecklist({ ...base, studyInRhythm: false }).map((i) => i.mark)).toEqual(['read', 'pray']);
    expect(todayChecklist({ ...base, studyInRhythm: false, courses: [plan] }).map((i) => i.mark)).toEqual(['read', 'pray', 'study']);
  });

  it('puts a novena day in progress before the Rosary, and the next plan day under Study', () => {
    const [read, pray, study] = todayChecklist({ ...base, readParts: ['firstReading'], novenas: [novena], courses: [plan] });
    expect(read?.detail).toBe('1 of 2 read');
    expect(pray).toMatchObject({ title: 'Novena to Saint Joseph', detail: 'Day 4 of 9', done: false });
    expect(study).toMatchObject({ title: 'Mark in 16 Days', detail: 'Day 5 of 16', done: false });
  });

  it('names what was prayed instead of claiming the Rosary', () => {
    const prayed = { date: '2026-10-12', prayers: [{ slug: 'divine-mercy-chaplet', title: 'Divine Mercy Chaplet' }] };
    const [, pray] = todayChecklist({ ...base, rhythm: { read: false, pray: true, study: false }, prayed });
    expect(pray).toMatchObject({ title: 'Divine Mercy Chaplet', detail: 'Prayed today', done: true });
    expect(prayedRosaryToday(prayed, '2026-10-12')).toBe(false);
    // Yesterday's prayers don't count today.
    expect(prayedRosaryToday({ date: '2026-10-11', prayers: [{ slug: 'rosary', title: 'The Rosary' }] }, '2026-10-12')).toBe(false);
  });

  it('shows the novena prayed today, and a plan day read today, as done', () => {
    const prayedNovena = { ...novena, daysDone: 4, lastPrayedOn: '2026-10-12' };
    const prayed = { date: '2026-10-12', prayers: [{ slug: novena.slug, title: novena.title }] };
    const readPlan = { ...plan, daysDone: 5, lastDoneOn: '2026-10-12' };
    const [, pray, study] = todayChecklist({
      ...base,
      rhythm: { read: false, pray: true, study: true },
      prayed,
      novenas: [prayedNovena],
      courses: [readPlan],
    });
    expect(pray).toMatchObject({ title: 'Novena to Saint Joseph', done: true });
    expect(study).toMatchObject({ title: 'Mark in 16 Days', detail: 'Day 5 read', done: true });
  });
});

describe('A word for today', () => {
  it('alternates a verse for the season with a saint or a Father', () => {
    const words = [10, 11, 12, 13].map((d) => dailyWordFor({ date: `2026-10-${d}`, season: 'ORDINARY_TIME' }));
    expect(words.map((w) => w.kind).filter((k) => k === 'verse')).toHaveLength(2);
    expect(dailyWordFor({ date: '2026-12-02', season: 'ADVENT' })).toSatisfy(
      (w: ReturnType<typeof dailyWordFor>) => w.kind !== 'verse' || DAILY_WORDS.VERSES.ADVENT.includes(w.citation),
    );
    expect(workTitle('SERMONS ON NEW TESTAMENT LESSONS 65.1')).toBe('Sermons on New Testament Lessons 65.1');
    expect(workTitle('Commentary on Mark')).toBe('Commentary on Mark');
  });
});

describe('onboarding', () => {
  const fresh = { onboarded: false, longestStreak: 0, plans: 0, novenas: 0, remindersOn: false, hasReadingPosition: false };
  it('shows the welcome on a new install only', () => {
    expect(needsOnboarding(fresh)).toBe('show');
    expect(needsOnboarding({ ...fresh, longestStreak: 3 })).toBe('mark-done');
    expect(needsOnboarding({ ...fresh, hasReadingPosition: true })).toBe('mark-done');
    expect(needsOnboarding({ ...fresh, onboarded: true })).toBe('no');
  });

  it('suggests a plan for each answer', () => {
    expect(suggestedPlan('curious').slug).toBe('mark-in-16-days');
    expect(suggestedPlan('ocia')).toEqual({ slug: 'mark-in-16-days', then: 'catechism-in-a-year' });
    expect(suggestedPlan('received').slug).toBe('acts-in-28-days');
    expect(suggestedPlan('deeper').slug).toBe('bible-in-a-year');
    expect(suggestedPlan(null).slug).toBe('mark-in-16-days');
  });
});

describe('journal and notes', () => {
  it('normalizes tags and picks up #tags typed in the text', () => {
    expect(normalizeTag('#Morning Prayer!')).toBe('morning-prayer');
    expect(normalizeTag('###')).toBe('');
    expect(tagsFrom('Thankful today #Gratitude and #rosary-week', ['prayer'])).toEqual(['prayer', 'gratitude', 'rosary-week']);
    expect(tagsFrom('no tags here', ['Reflection', 'reflection'])).toEqual(['reflection']);
  });

  it('makes notes with v4 ids and keys free entries by their id', () => {
    const id = newId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const entry = makeNote({ kind: 'journal', targetType: 'entry' }, '2026-10-12T10:00:00Z');
    expect(entry.targetKey).toBe(entry.id);
    expect(makeNote({ kind: 'highlight', targetType: 'verse', targetKey: 'Ps.23.1', highlightColor: 'blue' })).toMatchObject({
      targetKey: 'Ps.23.1',
      highlightColor: 'blue',
      tags: [],
    });
    expect(defaultTags('readings')).toEqual(['readings']);
    expect(defaultTags('verse')).toEqual(['scripture']);
  });

  it('lists journal entries newest first, by tag, skipping empty ones and other kinds', () => {
    const a = makeNote({ kind: 'journal', targetType: 'entry', body: 'first', tags: ['prayer'] }, '2026-10-10T08:00:00Z');
    const b = makeNote({ kind: 'journal', targetType: 'readings', targetKey: '2026-10-12', body: 'second', tags: ['readings', 'prayer'] }, '2026-10-12T08:00:00Z');
    const empty = makeNote({ kind: 'journal', targetType: 'entry', body: '  ' }, '2026-10-12T09:00:00Z');
    const mark = makeNote({ kind: 'bookmark', targetType: 'verse', targetKey: 'John.1.1' });
    expect(journalView([a, b, empty, mark], null)).toEqual({ entries: [b, a], tags: ['prayer', 'readings'] });
    expect(journalView([a, b], 'readings').entries).toEqual([b]);
  });
});
