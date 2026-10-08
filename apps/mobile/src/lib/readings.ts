import type { DaySnapshot, ReadingCitations } from '@pax/liturgy';

import type { Settings } from '@/data/types';

export type ReadingPart = keyof ReadingCitations;

export const READING_PARTS: { part: ReadingPart; label: string }[] = [
  { part: 'firstReading', label: 'First reading' },
  { part: 'psalm', label: 'Psalm' },
  { part: 'secondReading', label: 'Second reading' },
  { part: 'gospel', label: 'Gospel' },
];

/** XP for reading all of the day's readings (the canvas's "+10 XP"). */
export const READINGS_XP = 10;

export function isReadingPart(value: unknown): value is ReadingPart {
  return READING_PARTS.some((p) => p.part === value);
}

/** The day's readings in order, skipping the second reading on weekdays. */
export function readingsOf(day: Pick<DaySnapshot, 'readings'>): { part: ReadingPart; label: string; citation: string }[] {
  const r = day.readings;
  if (!r) return [];
  return READING_PARTS.filter(({ part }) => r[part]).map(({ part, label }) => ({ part, label, citation: r[part]! }));
}

/** Parts read in the app today (a new day starts empty). */
export function readParts(settings: Pick<Settings, 'readingsRead'>, date: string): ReadingPart[] {
  return settings.readingsRead?.date === date ? settings.readingsRead.parts.filter(isReadingPart) : [];
}

/**
 * A question from Pax under the readings, rotating by date. Pax has no reflections for each
 * day's texts yet, so these work with any readings.
 */
const PAX_ASKS = [
  'What word or phrase from today’s Gospel stays with you?',
  'Where do you see God keeping a promise in today’s readings?',
  'Which person in today’s Gospel are you most like right now?',
  'What is one thing Jesus asks of you in today’s Gospel?',
  'Is there a line in the Psalm you could pray again tonight?',
  'What does today’s first reading show you about who God is?',
  'Who could you share one line of today’s readings with?',
  'What surprised you in today’s readings?',
  'Where do you need the hope in today’s readings this week?',
  'What would change if you took today’s Gospel at its word?',
  'Is there something in today’s readings you want to ask God about?',
  'Which verse would you like to remember by heart?',
  'How does today’s Gospel invite you to love someone near you?',
  'What does today’s Psalm say you can trust God with?',
];

export function paxAsks(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dayOfYear = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
  return PAX_ASKS[dayOfYear % PAX_ASKS.length]!;
}
