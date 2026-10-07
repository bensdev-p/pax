import { addDays } from '@pax/liturgy';

/**
 * Streaks count consecutive local dates with any activity (SPEC: Data model rule 4). Today
 * not being done yet does not break the streak; it ends at yesterday instead.
 * Grace days arrive with the Profile streak view in Phase 2.
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
