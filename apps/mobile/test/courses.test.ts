import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { getDaySnapshots } from '@pax/liturgy';
import { beforeAll, describe, expect, it } from 'vitest';

import { createContentStore } from '@/data/contentStore';
import type { SqlParam } from '@/data/db';
import { createLibrary } from '@/data/library';
import type { ContentStore, CourseProgress } from '@/data/types';
import { afterReading, daysBehind, isFinished, nextDay, startCourse } from '@/lib/courses';
import { courseReminder, planNotifications } from '@/notifications/plan';

const CONTENT = fileURLToPath(new URL('../assets/content/content.db', import.meta.url));
let content: ContentStore;
let db: { all: <T>(sql: string, p?: SqlParam[]) => Promise<T[]>; first: <T>(sql: string, p?: SqlParam[]) => Promise<T | null>; hasFts: boolean };

beforeAll(() => {
  const raw = new DatabaseSync(CONTENT, { readOnly: true });
  db = {
    all: async <T,>(sql: string, params: SqlParam[] = []) => raw.prepare(sql).all(...params) as T[],
    first: async <T,>(sql: string, params: SqlParam[] = []) => (raw.prepare(sql).get(...params) as T) ?? null,
    hasFts: false,
  };
  content = createContentStore(db, 'test');
});

describe('Reading plans in content.db', () => {
  it('has the five plans with every day', async () => {
    const courses = await content.courses();
    expect(courses.map((c) => [c.slug, c.days])).toEqual([
      ['bible-in-a-year', 365],
      ['catechism-in-a-year', 365],
      ['mark-in-16-days', 16],
      ['psalms-in-30-days', 30],
      ['acts-in-28-days', 28],
    ]);
    for (const c of courses) expect(await content.courseDays(c.slug)).toHaveLength(c.days);
  });

  it('reads the whole Bible once, with a Psalm or Proverb every day', async () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 365; d++) {
      const day = await content.courseDay('bible-in-a-year', d);
      expect(day?.wisdom).toHaveLength(1);
      for (const u of day!.readings) {
        const key = `${u.book}.${u.chapter}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    const chapters = await db.all<{ n: number }>(
      "SELECT count(DISTINCT book || '.' || douay_chapter) AS n FROM bible_verses WHERE book NOT IN ('Ps', 'Prov')",
    );
    expect(seen.size).toBe(chapters[0]!.n);
    const first = await content.courseDay('bible-in-a-year', 1);
    expect(first).toMatchObject({ section: 'Beginnings', label: 'Genesis 1–4', wisdom_label: 'Psalm 1' });
  });

  it('covers every Catechism paragraph in order', async () => {
    let expected = 1;
    for (let d = 1; d <= 365; d++) {
      const day = await content.courseDay('catechism-in-a-year', d);
      expect(day?.ccc_first).toBe(expected);
      expected = day!.ccc_last! + 1;
    }
    expect(expected).toBe(2866);
  });

  it('opens each Psalms day as Douay text', async () => {
    const lib = createLibrary(db);
    const day = await content.courseDay('psalms-in-30-days', 4);
    const ch = await lib.chapter(day!.readings[0]!.book, day!.readings[0]!.chapter);
    expect(ch?.verses.length).toBeGreaterThan(0);
    expect(day?.label).toMatch(/^Psalms \d+–\d+ \(\d+–\d+\)$/);
  });
});

describe('Plan progress', () => {
  const course = { slug: 'mark-in-16-days', title: 'Mark in 16 Days', days: 16 };

  it('moves one day at a time and never past the end', () => {
    let p: CourseProgress = startCourse(course, '2026-10-08');
    expect(nextDay(p)).toBe(1);
    p = afterReading(p, 1, '2026-10-08');
    expect(p).toMatchObject({ daysDone: 1, lastDoneOn: '2026-10-08' });
    expect(afterReading(p, 3, '2026-10-08')).toBe(p); // must read day 2 first
    p = afterReading(p, 2, '2026-10-08'); // reading ahead counts
    expect(nextDay(p)).toBe(3);
    const done = { ...p, daysDone: 16 };
    expect(isFinished(done)).toBe(true);
    expect(nextDay(done)).toBe(16);
  });

  it('counts missed days before today, gently', () => {
    const p = { ...startCourse(course, '2026-10-01'), daysDone: 3 };
    expect(daysBehind(p, '2026-10-04')).toBe(0); // days 1–3 read, day 4 is today's
    expect(daysBehind(p, '2026-10-08')).toBe(4);
    expect(daysBehind({ ...p, daysDone: 16 }, '2026-12-01')).toBe(0);
  });

  it('plans a daily plan reminder until the last day', async () => {
    const days = await getDaySnapshots('2026-10-08', 14);
    const p: CourseProgress = { ...startCourse(course, '2026-09-25'), daysDone: 12, lastDoneOn: '2026-10-07', reminderTime: '06:30' };
    const off = { morning: { enabled: false, time: '07:30' }, evening: { enabled: false, time: '20:00' }, nudges: false, angelus: false };
    const plan = planNotifications(off, days, { now: new Date(2026, 9, 8, 5), today: '2026-10-08', doneToday: false, daily: [courseReminder(p)] });
    expect(plan.map((n) => `${n.date} ${n.title}`)).toEqual([
      '2026-10-08 Mark in 16 Days · Day 13',
      '2026-10-09 Mark in 16 Days · Day 14',
      '2026-10-10 Mark in 16 Days · Day 15',
      '2026-10-11 Mark in 16 Days · Day 16',
    ]);
    expect(plan[0]?.url).toBe('paxapp://course/mark-in-16-days');
  });
});
