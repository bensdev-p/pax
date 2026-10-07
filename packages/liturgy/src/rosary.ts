import type { DaySnapshot } from './types';

export type MysterySet = 'joyful' | 'luminous' | 'sorrowful' | 'glorious';

/** Monday → Saturday. Sunday is decided by the season. */
const WEEKDAY_SETS: Record<number, MysterySet> = {
  1: 'joyful',
  2: 'sorrowful',
  3: 'glorious',
  4: 'luminous',
  5: 'sorrowful',
  6: 'joyful',
};

/**
 * The mysteries of the day (Rosarium Virginis Mariae 38). On Sundays the season decides:
 * Joyful in Advent and Christmas, Sorrowful in Lent, Glorious otherwise.
 */
export function mysteriesForDay(
  snapshot: Pick<DaySnapshot, 'dayOfWeek' | 'season'>,
): MysterySet {
  if (snapshot.dayOfWeek !== 0) return WEEKDAY_SETS[snapshot.dayOfWeek] ?? 'joyful';
  switch (snapshot.season) {
    case 'ADVENT':
    case 'CHRISTMAS_TIME':
      return 'joyful';
    case 'LENT':
      return 'sorrowful';
    default:
      return 'glorious';
  }
}
