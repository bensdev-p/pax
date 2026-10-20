import { getDaySnapshots } from '@pax/liturgy';
import { describe, expect, it } from 'vitest';

import {
  buildWidgetTimelines,
  hrefUrl,
  localTime,
  mondayOf,
  prayerForHour,
  WIDGET_DAYS,
  type WidgetInput,
} from '@/widgets/widgetFeed';

async function input(overrides: Partial<WidgetInput> = {}): Promise<WidgetInput> {
  // Tuesday, October 20, 2026 at 8:30 in the morning (phone time).
  const snapshots = await getDaySnapshots(mondayOf('2026-10-20'), 70);
  return {
    now: new Date(2026, 9, 20, 8, 30),
    snapshots,
    activity: [{ date: '2026-10-19', read: true, pray: true, study: false, grace: false }],
    progress: { date: '2026-10-20', currentStreak: 23, doneToday: true, rhythm: { read: true, pray: false, study: false } },
    settings: { appearance: 'light', lockedColor: null, studyInRhythm: true, prayedToday: null, readingsRead: null },
    novenas: [],
    courses: [],
    saints: { '2026-10-20': { name: 'Saint Paul of the Cross', rank: 'Optional memorial' } },
    words: {
      '2026-10-20': { label: 'A verse for today', text: 'The Lord is my shepherd.', source: 'Psalm 22:1 · Douay-Rheims', href: { pathname: '/verse/[ref]', params: { ref: 'Ps.23.1' } } },
    },
    paxImages: { happy: 'file:///group/pax-happy.png' },
    ...overrides,
  };
}

describe('widget links', () => {
  it('turns app routes into paxapp:// links', () => {
    expect(hrefUrl('/readings')).toBe('paxapp://readings');
    expect(hrefUrl({ pathname: '/course/[slug]/[day]', params: { slug: 'psalms', day: '12' } })).toBe('paxapp://course/psalms/12');
    expect(hrefUrl({ pathname: '/fathers/[author]', params: { author: 'augustine-of-hippo', name: 'Augustine of Hippo' } })).toBe(
      'paxapp://fathers/augustine-of-hippo?name=Augustine%20of%20Hippo',
    );
  });
});

describe('prayer for the hour', () => {
  it('follows the day from the Morning Offering to the Hail, Holy Queen', () => {
    const ordinary = { season: 'ORDINARY_TIME' as const };
    expect(prayerForHour(ordinary, 8)).toMatchObject({ when: 'Morning', title: 'Morning Offering', next: 'Next: The Angelus at noon' });
    expect(prayerForHour(ordinary, 15)).toMatchObject({ title: 'Divine Mercy Chaplet', url: 'paxapp://devotion/divine-mercy-chaplet' });
    expect(prayerForHour(ordinary, 19)).toMatchObject({ title: 'The Examen', next: 'Next: Hail, Holy Queen at 10 PM' });
    expect(prayerForHour(ordinary, 23)).toMatchObject({ title: 'Hail, Holy Queen', next: 'Next: Morning Offering at 5 AM' });
    expect(prayerForHour(ordinary, 2).next).toBe('Next: Morning Offering at 5 AM');
  });

  it('prays the Regina Caeli at noon in Easter Time', () => {
    expect(prayerForHour({ season: 'EASTER_TIME' }, 12)).toMatchObject({ title: 'Regina Caeli', url: 'paxapp://prayer/regina-caeli' });
  });
});

describe('widget timelines', () => {
  it('starts each widget now and runs a week ahead', async () => {
    const t = buildWidgetTimelines(await input());
    const now = new Date(2026, 9, 20, 8, 30);
    for (const entries of [t.today, t.prayer, t.week]) expect(entries[0]!.date).toEqual(now);
    // Today changes at 7 AM, 6 PM and 10 PM and at midnight; it is past 7 AM already.
    expect(t.today).toHaveLength(3 + 4 * (WIDGET_DAYS - 1));
    expect(t.prayer).toHaveLength(5 + 6 * (WIDGET_DAYS - 1));
    expect(t.week).toHaveLength(WIDGET_DAYS);
    expect(t.today.at(-1)!.date).toEqual(localTime('2026-10-26', 22));
    // Only days whose word was found get an entry.
    expect(t.word).toHaveLength(1);
  });

  it('shows today on the Today widget, in the day’s color', async () => {
    const [entry] = buildWidgetTimelines(await input()).today;
    expect(entry!.props).toMatchObject({
      weekday: 'TUESDAY',
      dateLabel: 'Oct 20',
      streak: 23,
      rhythm: { read: true, pray: false, study: false },
      marks: ['read', 'pray', 'study'],
      subtitle: 'Saint Paul of the Cross · Optional memorial',
      inline: 'Saint Paul of the Cross',
      pax: { image: 'file:///group/pax-happy.png' },
      url: 'paxapp://today',
    });
    expect(entry!.props.colors.light.accent).toBe('#24913C');
    expect(entry!.props.items[0]).toMatchObject({ title: 'Today’s readings', done: true, url: 'paxapp://readings' });
  });

  it('starts the next days fresh, with the Examen offered in the evening', async () => {
    const t = buildWidgetTimelines(await input());
    const tomorrowEvening = t.today.find((e) => e.date.getTime() === localTime('2026-10-21', 18).getTime())!;
    expect(tomorrowEvening.props.rhythm).toEqual({ read: false, pray: false, study: false });
    expect(tomorrowEvening.props.weekday).toBe('WEDNESDAY');
    expect(tomorrowEvening.props.items[1]).toMatchObject({ title: 'The Examen', url: 'paxapp://examen' });
  });

  it('leaves Study out when it isn’t part of the rhythm', async () => {
    const t = buildWidgetTimelines(await input({ settings: { appearance: 'system', lockedColor: 'violet', studyInRhythm: false, prayedToday: null, readingsRead: null } }));
    expect(t.today[0]!.props.marks).toEqual(['read', 'pray']);
    expect(t.today[0]!.props.scheme).toBe('system');
    expect(t.today[0]!.props.colors.light.accent).toBe('#7C4DDB');
  });

  it('offers the Rosary of the day and marks it once prayed', async () => {
    const prayed = await input({ settings: { appearance: 'light', lockedColor: null, studyInRhythm: true, prayedToday: { date: '2026-10-20', prayers: [{ slug: 'rosary', title: 'The Rosary' }] }, readingsRead: null } });
    const t = buildWidgetTimelines(prayed);
    expect(t.prayer[0]!.props.rosary).toMatchObject({ title: 'Sorrowful Mysteries', prayed: true, detail: 'Prayed today' });
    expect(t.prayer[0]!.props.now.title).toBe('Morning Offering');
    const wednesday = t.prayer.find((e) => e.date.getTime() === localTime('2026-10-21').getTime())!;
    expect(wednesday.props.rosary).toMatchObject({ title: 'Glorious Mysteries', prayed: false });
  });

  it('shows the week’s colors, the days kept and the next solemnity', async () => {
    const [entry] = buildWidgetTimelines(await input()).week;
    const week = entry!.props;
    expect(week.header).toBe('ORDINARY TIME · WEEK 29');
    expect(week.days.map((d) => d.day)).toEqual([19, 20, 21, 22, 23, 24, 25]);
    expect(week.days.map((d) => d.done)).toEqual([true, true, null, null, null, null, null]);
    expect(week.days[1]!.today).toBe(true);
    expect(week.days[0]!.dot.light).toBe('#D12F33');
    expect(week.next).toBe('All Saints · Sunday, Nov 1 · in 12 days');
  });

  it('carries the word for today with a link into the app', async () => {
    const [entry] = buildWidgetTimelines(await input()).word;
    expect(entry!.props).toMatchObject({ label: 'A verse for today', source: 'Psalm 22:1 · Douay-Rheims', url: 'paxapp://verse/Ps.23.1' });
  });
});
