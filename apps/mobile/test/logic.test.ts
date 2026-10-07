import { getDaySnapshots } from '@pax/liturgy';
import { describe, expect, it } from 'vitest';

import { computeStreak } from '@/data/streak';
import { cycleLine, paxGreeting, paxMoodFor } from '@/lib/format';
import { rosarySteps } from '@/lib/rosary';
import { buildWidgetFeed } from '@/widgets/widgetFeed';
import type { RosaryMystery } from '@/data/types';

describe('computeStreak', () => {
  it('counts back from today, or from yesterday when today is not done yet', () => {
    expect(computeStreak(['2026-10-05', '2026-10-06', '2026-10-07'], '2026-10-07')).toEqual({ current: 3, longest: 3 });
    expect(computeStreak(['2026-10-05', '2026-10-06'], '2026-10-07').current).toBe(2);
    expect(computeStreak(['2026-10-04', '2026-10-06'], '2026-10-07').current).toBe(1);
    expect(computeStreak([], '2026-10-07')).toEqual({ current: 0, longest: 0 });
  });

  it('tracks the longest run, across month and year boundaries', () => {
    const run = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-10-07'];
    expect(computeStreak(run, '2026-10-07')).toEqual({ current: 1, longest: 4 });
  });
});

describe('widget feed', () => {
  it('carries 14 days with deep links and a Pax mood timeline', async () => {
    const days = await getDaySnapshots('2026-10-17', 14);
    const feed = buildWidgetFeed(
      days,
      { date: '2026-10-17', currentStreak: 12, doneToday: false, xpToday: 20, xpGoal: 30 },
      new Date('2026-10-17T08:00:00Z'),
    );
    expect(feed.days).toHaveLength(14);
    expect(feed.days[0]).toMatchObject({ key: 'ignatius_of_antioch_bishop', color: 'red', isMartyr: true, readingCount: 3, url: 'paxapp://today' });
    expect(feed.paxTimeline.filter((e) => e.at.startsWith('2026-10-17')).map((e) => e.mood)).toEqual([
      'asleep',
      'hello',
      'encouraging',
      'asleep',
    ]);
  });

  it('switches Pax to happy once today is done', async () => {
    const days = await getDaySnapshots('2026-10-17', 1);
    const feed = buildWidgetFeed(days, { date: '2026-10-17', currentStreak: 13, doneToday: true, xpToday: 30, xpGoal: 30 });
    expect(feed.paxTimeline.slice(1).every((e) => e.mood === 'happy')).toBe(true);
  });
});

describe('rosarySteps', () => {
  it('builds opening prayers, five decades and the closing prayers', () => {
    const mysteries = [1, 2, 3, 4, 5].map(
      (n) => ({ slug: `m${n}`, number: n, mystery_set: 'joyful' }) as RosaryMystery,
    );
    const steps = rosarySteps(mysteries);
    expect(steps).toHaveLength(5 + 5 * 5 + 3);
    const hailMarys = steps.reduce((n, s) => n + (s.kind === 'beads' ? s.count : 0), 0);
    expect(hailMarys).toBe(53);
    expect(steps.at(-1)).toMatchObject({ kind: 'prayer', slug: 'sign-of-the-cross' });
  });
});

describe('Today copy', () => {
  it('names the new year on the First Sunday of Advent', async () => {
    const [day] = await getDaySnapshots('2026-11-29', 1);
    expect(cycleLine(day!)).toBe('Year B begins');
    expect(paxGreeting(day!, { doneToday: false, hour: 9 })).toMatch(/new Church year/);
  });

  it('honors a martyr by short name', async () => {
    const [day] = await getDaySnapshots('2026-10-17', 1);
    expect(paxGreeting(day!, { doneToday: false, hour: 9 })).toMatch(/^Saint Ignatius of Antioch gave everything/);
    expect(cycleLine(day!)).toBe('Memorial · Year II');
  });
});

describe('paxMoodFor', () => {
  it('follows the day like the widget timeline', () => {
    expect(paxMoodFor({ doneToday: false, hour: 8 })).toBe('hello');
    expect(paxMoodFor({ doneToday: false, hour: 19 })).toBe('encouraging');
    expect(paxMoodFor({ doneToday: false, hour: 23 })).toBe('asleep');
    expect(paxMoodFor({ doneToday: true, hour: 23 })).toBe('happy');
  });
});
