import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { getDaySnapshot, getDaySnapshots } from '@pax/liturgy';
import { beforeAll, describe, expect, it } from 'vitest';

import { createContentStore } from '@/data/contentStore';
import { detectFts, type ReadDb, type SqlParam } from '@/data/db';
import { createLibrary } from '@/data/library';
import type { ContentStore, NovenaProgress } from '@/data/types';
import { afterPraying, novenaDayIndex, novenaWindow } from '@/lib/devotions';
import { paxAsks, readingsOf, readParts } from '@/lib/readings';
import { rankChip, saintColor, saintForDay } from '@/lib/saints';
import { planNotifications } from '@/notifications/plan';

const CONTENT = fileURLToPath(new URL('../assets/content/content.db', import.meta.url));
let db: ReadDb;
let content: ContentStore;

beforeAll(async () => {
  const raw = new DatabaseSync(CONTENT, { readOnly: true });
  const base = {
    all: async <T,>(sql: string, params: SqlParam[] = []) => raw.prepare(sql).all(...params) as T[],
    first: async <T,>(sql: string, params: SqlParam[] = []) => (raw.prepare(sql).get(...params) as T) ?? null,
  };
  db = { ...base, hasFts: await detectFts(base) };
  content = createContentStore(db, 'test');
});

describe('Saint of the day', () => {
  it('has an entry for every saint celebration in the coming year', async () => {
    const days = await getDaySnapshots('2026-01-01', 365);
    const missing: string[] = [];
    for (const day of days) {
      for (const key of [day.key, ...day.optionalMemorials.map((m) => m.key)]) {
        if (day.saintKeys.length === 0 && key === day.key) continue;
        if (!(await content.saint(key)) && (key !== day.key || day.rank !== 'WEEKDAY')) missing.push(`${day.date} ${key}`);
      }
    }
    // US civic and Triduum days that honor no saint.
    const noSaint = /unborn_children|lords_supper|independence_day|thanksgiving_day/;
    expect(missing.filter((m) => !noSaint.test(m))).toEqual([]);
  });

  it('uses the celebration on a memorial (Ignatius of Antioch, Oct 17 2026)', async () => {
    const found = await saintForDay(content, await getDaySnapshot('2026-10-17'));
    expect(found?.saint).toMatchObject({ romcal_key: 'ignatius_of_antioch_bishop', name: 'Saint Ignatius of Antioch' });
    expect(found?.saint.facts).toHaveLength(3);
    expect(saintColor(found!.saint, found!.celebration)).toBe('red');
    expect(rankChip(found!.saint, found!.celebration)).toBe('Memorial · Martyr');
  });

  it('falls back to an optional memorial on a weekday (Faustina, Oct 5 2026)', async () => {
    const found = await saintForDay(content, await getDaySnapshot('2026-10-05'));
    expect(found?.saint.romcal_key).toBe('faustina_kowalska_virgin');
    expect(found?.celebration.optional).toBe(true);
    expect(saintColor(found!.saint, found!.celebration)).toBe('white');
  });

  it('finds saints and devotions in search, with and without FTS', async () => {
    for (const hasFts of [db.hasFts, false]) {
      const lib = createLibrary({ ...db, hasFts });
      const kinds = (await lib.search('Ignatius')).map((h) => `${h.kind}:${h.key}`);
      expect(kinds).toContain('saint:ignatius_of_loyola_priest');
      expect((await lib.search('humility')).some((h) => h.kind === 'devotion' && h.key === 'litany-of-humility')).toBe(true);
    }
  });
});

describe('Devotions', () => {
  it('parses steps and novena days, and every prayer step exists', async () => {
    const devotions = await content.devotions();
    const prayers = new Set((await content.prayers()).map((p) => p.slug));
    expect(devotions.length).toBeGreaterThanOrEqual(12);
    for (const d of devotions) {
      for (const s of d.steps) if (s.type === 'prayer') expect(prayers).toContain(s.slug);
      if (d.kind === 'novena') expect(d.days).toHaveLength(9);
    }
    const chaplet = await content.devotion('divine-mercy-chaplet');
    expect(chaplet?.steps.filter((s) => s.type === 'repeat').map((s) => s.type === 'repeat' && s.count)).toEqual([10, 10, 10, 10, 10, 3]);
  });

  it('dates a novena to end the day before its feast', async () => {
    expect(await novenaWindow('immaculate_conception_of_the_blessed_virgin_mary', '2026-10-07')).toEqual({
      start: '2026-11-29',
      end: '2026-12-07',
      feast: '2026-12-08',
    });
    // After this year's window, the next year's.
    expect((await novenaWindow('joseph_spouse_of_mary', '2026-10-07'))?.start).toBe('2027-03-10');
  });

  it('counts one novena day per date', () => {
    const d = { slug: 'christmas-novena', title: 'Christmas Novena' };
    const day1 = afterPraying(undefined, d, '2026-12-16');
    expect(day1).toMatchObject({ daysDone: 1, startedOn: '2026-12-16', lastPrayedOn: '2026-12-16' });
    expect(afterPraying(day1, d, '2026-12-16').daysDone).toBe(1);
    expect(novenaDayIndex(day1, '2026-12-16')).toBe(0);
    expect(novenaDayIndex(day1, '2026-12-17')).toBe(1);
    expect(afterPraying(day1, d, '2026-12-17').daysDone).toBe(2);
  });

  it('plans a novena reminder for each remaining day, skipping a day already prayed', async () => {
    const days = await getDaySnapshots('2026-12-18', 14);
    const novena: NovenaProgress = {
      slug: 'christmas-novena',
      title: 'Christmas Novena',
      startedOn: '2026-12-16',
      daysDone: 3,
      lastPrayedOn: '2026-12-18',
      reminderTime: '19:30',
    };
    const off = { morning: { enabled: false, time: '07:30' }, evening: { enabled: false, time: '20:00' }, nudges: false, angelus: false };
    const plan = planNotifications(off, days, { now: new Date(2026, 11, 18, 8), today: '2026-12-18', doneToday: true, novenas: [novena] });
    expect(plan.map((n) => `${n.date} ${n.title}`)).toEqual([
      '2026-12-19 Christmas Novena · Day 4',
      '2026-12-20 Christmas Novena · Day 5',
      '2026-12-21 Christmas Novena · Day 6',
      '2026-12-22 Christmas Novena · Day 7',
      '2026-12-23 Christmas Novena · Day 8',
      '2026-12-24 Christmas Novena · Day 9',
    ]);
    expect(plan[0]?.url).toBe('paxapp://devotion/christmas-novena');
  });
});

describe('Readings', () => {
  it('lists the day’s readings and remembers which were read today only', async () => {
    const sunday = await getDaySnapshot('2026-10-11');
    expect(readingsOf(sunday).map((r) => r.part)).toEqual(['firstReading', 'psalm', 'secondReading', 'gospel']);
    const weekday = await getDaySnapshot('2026-10-07');
    expect(readingsOf(weekday).map((r) => r.part)).toEqual(['firstReading', 'psalm', 'gospel']);
    const settings = { readingsRead: { date: '2026-10-07', parts: ['psalm', 'bogus'] } };
    expect(readParts(settings, '2026-10-07')).toEqual(['psalm']);
    expect(readParts(settings, '2026-10-08')).toEqual([]);
  });

  it('every reading in the next year opens as Douay-Rheims text', async () => {
    const lib = createLibrary(db);
    const days = await getDaySnapshots('2026-10-07', 366);
    const empty: string[] = [];
    for (const day of days) {
      for (const r of readingsOf(day)) {
        if (!(await lib.passage(r.citation)).length) empty.push(`${day.date} ${r.citation}`);
      }
    }
    // Esther's Greek additions are cited by letter (Esther C:12), which the Douay numbers 13–16.
    expect(empty.filter((e) => !/Esther [A-F]:/.test(e))).toEqual([]);
  });

  it('maps English chapter breaks to the lectionary’s numbering', async () => {
    const lib = createLibrary(db);
    const christmas = await lib.passage('Isaiah 9:1–6');
    expect(christmas[0]?.[0]).toMatchObject({ douay_chapter: 9, douay_verse: 2 });
    expect(christmas[0]?.[0]?.text).toMatch(/^The people that walked in darkness/);
    const advent = await lib.passage('Isaiah 63:16b–17, 19b; 64:2–7');
    expect(advent[2]?.[0]).toMatchObject({ douay_chapter: 64, douay_verse: 3 });
    const bethlehem = await lib.passage('Micah 5:1–4a');
    expect(bethlehem[0]?.[0]?.text).toMatch(/^And thou Bethlehem/);
    const zion = await lib.passage('Zechariah 2:14–17');
    expect(zion[0]?.[0]).toMatchObject({ douay_chapter: 2, douay_verse: 10 });
  });

  it('rotates Pax’s question by date', () => {
    expect(paxAsks('2026-10-07')).not.toBe(paxAsks('2026-10-08'));
  });
});
