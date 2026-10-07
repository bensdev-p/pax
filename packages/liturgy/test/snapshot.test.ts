import { describe, expect, it } from 'vitest';

import { getDaySnapshot, getDaySnapshots, mysteriesForDay, toIsoDate } from '../src';

describe('getDaySnapshot', () => {
  it('Ash Wednesday 2026 is violet Lent with Joel 2', async () => {
    const day = await getDaySnapshot('2026-02-18');
    expect(day).toMatchObject({
      key: 'ash_wednesday',
      name: 'Ash Wednesday',
      season: 'LENT',
      seasonName: 'Lent',
      color: 'violet',
      saintKey: null,
      sundayCycle: 'A',
      weekdayCycle: 'II',
    });
    expect(day.readings).toMatchObject({
      firstReading: 'Joel 2:12–18',
      gospel: 'Matthew 6:1–6, 16–18',
    });
    expect(day.usccbUrl).toBe('https://bible.usccb.org/bible/readings/021826.cfm');
  });

  it('Easter Sunday 2026 is a white solemnity in Easter Time, Year A', async () => {
    const day = await getDaySnapshot('2026-04-05');
    expect(day).toMatchObject({
      key: 'easter_sunday',
      rank: 'SOLEMNITY',
      season: 'EASTER_TIME',
      color: 'white',
      sundayCycle: 'A',
      lectionaryCycle: 'A',
    });
    expect(day.readings?.firstReading).toMatch(/^Acts 10:34/);
    expect(day.readings?.gospel).toMatch(/^John 20:1/);
  });

  it('Pentecost 2026 is red', async () => {
    const day = await getDaySnapshot('2026-05-24');
    expect(day).toMatchObject({
      key: 'pentecost_sunday',
      rank: 'SOLEMNITY',
      color: 'red',
      lectionaryCycle: 'A',
    });
    expect(day.readings?.firstReading).toMatch(/^Acts 2:1/);
  });

  it('Gaudete Sunday 2026 is rose, with violet allowed, in Year B', async () => {
    const day = await getDaySnapshot('2026-12-13');
    expect(day).toMatchObject({
      key: 'advent_3_sunday',
      name: 'Third Sunday of Advent',
      rank: 'SUNDAY',
      season: 'ADVENT',
      color: 'rose',
      colors: ['rose', 'violet'],
      sundayCycle: 'B',
      lectionaryCycle: 'B',
      weekOfSeason: 3,
    });
    expect(day.readings?.firstReading).toMatch(/^Isaiah 61:1/);
    expect(day.readings?.gospel).toMatch(/^John 1:6/);
  });

  it("a martyr's memorial turns an Ordinary Time weekday red (St Ignatius, Oct 17 2026)", async () => {
    const day = await getDaySnapshot('2026-10-17');
    expect(day).toMatchObject({
      key: 'ignatius_of_antioch_bishop',
      name: 'Saint Ignatius of Antioch, Bishop and Martyr',
      rank: 'MEMORIAL',
      season: 'ORDINARY_TIME',
      color: 'red',
      saintKey: 'ignatius_of_antioch_bishop',
      isMartyr: true,
      weekdayKey: 'ordinary_time_28_saturday',
      weekdayCycle: 'II',
      lectionaryCycle: 'II',
    });
    // Memorial without proper readings: the Saturday of week 28, Year II.
    expect(day.readings).toEqual({
      firstReading: 'Ephesians 1:15–23',
      psalm: 'Psalm 8:2–3ab, 4–5, 6–7',
      secondReading: null,
      gospel: 'Luke 12:8–12',
    });
  });

  it('the day before (a plain Friday) stays green', async () => {
    const day = await getDaySnapshot('2026-10-16');
    expect(day.color).toBe('green');
    expect(day.isMartyr).toBe(false);
  });

  it('All Souls defaults to violet, with black allowed', async () => {
    const day = await getDaySnapshot('2026-11-02');
    expect(day.color).toBe('violet');
    expect(day.colors).toContain('black');
  });

  it('accepts a Date in local time', async () => {
    const day = await getDaySnapshot(new Date(2026, 9, 17, 23, 30));
    expect(day.date).toBe('2026-10-17');
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('returns 14 consecutive days across a year boundary for the widget feed', async () => {
    const days = await getDaySnapshots('2026-12-25', 14);
    expect(days).toHaveLength(14);
    expect(days[0]?.key).toBe('nativity_of_the_lord');
    expect(days[13]?.date).toBe('2027-01-07');
    expect(days.every((d) => d.readings !== null)).toBe(true);
  });
});

describe('mysteriesForDay', () => {
  it('follows the weekday pattern', () => {
    expect(mysteriesForDay({ dayOfWeek: 1, season: 'ORDINARY_TIME' })).toBe('joyful');
    expect(mysteriesForDay({ dayOfWeek: 2, season: 'ORDINARY_TIME' })).toBe('sorrowful');
    expect(mysteriesForDay({ dayOfWeek: 3, season: 'ORDINARY_TIME' })).toBe('glorious');
    expect(mysteriesForDay({ dayOfWeek: 4, season: 'LENT' })).toBe('luminous');
    expect(mysteriesForDay({ dayOfWeek: 6, season: 'ADVENT' })).toBe('joyful');
  });

  it('uses the season on Sundays', async () => {
    expect(mysteriesForDay(await getDaySnapshot('2026-12-13'))).toBe('joyful'); // Advent
    expect(mysteriesForDay(await getDaySnapshot('2026-03-15'))).toBe('sorrowful'); // Lent
    expect(mysteriesForDay(await getDaySnapshot('2026-04-05'))).toBe('glorious'); // Easter
    expect(mysteriesForDay(await getDaySnapshot('2026-10-18'))).toBe('glorious'); // Ordinary Time
  });
});
