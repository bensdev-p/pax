import { getDaySnapshots } from '@pax/liturgy';
import { describe, expect, it } from 'vitest';

import type { NotificationPrefs } from '@/data/types';
import { formatTime, MAX_PENDING, planNotifications } from '@/notifications/plan';

const prefs = (over: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  morning: { enabled: true, time: '06:45' },
  evening: { enabled: true, time: '21:15' },
  nudges: true,
  angelus: true,
  ...over,
});

describe('planNotifications', () => {
  it('uses the custom morning and evening times, plus nudges and the Angelus', async () => {
    const days = await getDaySnapshots('2026-10-08', 1);
    const plan = planNotifications(prefs(), days, {
      now: new Date(2026, 9, 8, 0, 0),
      today: '2026-10-08',
      doneToday: false,
    });
    // The 21:00 nudge is skipped: it sits within 45 minutes of the 21:15 evening reminder.
    expect(plan.map((n) => `${n.time} ${n.kind}`)).toEqual([
      '06:45 morning_reminder',
      '12:00 angelus',
      '13:00 streak_nudge',
      '17:30 streak_nudge',
      '21:15 evening_reminder',
    ]);
  });

  it('goes quiet for the rest of today once something is done, except the Angelus', async () => {
    const days = await getDaySnapshots('2026-10-08', 2);
    const plan = planNotifications(prefs(), days, {
      now: new Date(2026, 9, 8, 10, 0),
      today: '2026-10-08',
      doneToday: true,
    });
    expect(plan.filter((n) => n.date === '2026-10-08').map((n) => n.kind)).toEqual(['angelus']);
    expect(plan.filter((n) => n.date === '2026-10-09').length).toBe(5);
  });

  it('never schedules in the past and stays under the iOS limit of 64', async () => {
    const days = await getDaySnapshots('2026-10-08', 14);
    const now = new Date(2026, 9, 8, 15, 0);
    const plan = planNotifications(prefs({ evening: { enabled: true, time: '19:00' } }), days, {
      now,
      today: '2026-10-08',
      doneToday: false,
    });
    expect(plan.length).toBe(MAX_PENDING);
    expect(plan.every((n) => n.at > now)).toBe(true);
    expect(plan[0]?.time).toBe('17:30');
  });

  it('schedules nothing when everything is off', async () => {
    const days = await getDaySnapshots('2026-10-08', 14);
    const off = prefs({
      morning: { enabled: false, time: '07:30' },
      evening: { enabled: false, time: '20:00' },
      nudges: false,
      angelus: false,
    });
    expect(planNotifications(off, days, { now: new Date(2026, 9, 8), today: '2026-10-08', doneToday: false })).toEqual([]);
  });

  it('formats times for people', () => {
    expect(formatTime('06:45')).toBe('6:45 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('21:15')).toBe('9:15 PM');
  });
});
