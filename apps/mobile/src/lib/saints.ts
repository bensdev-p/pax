import type { DaySnapshot, LiturgicalColor } from '@pax/liturgy';

import type { ContentStore, Saint } from '@/data/types';

/** One celebration on a date: the day's own, or one of its optional memorials. */
export interface Celebration {
  key: string;
  name: string;
  date: string;
  optional: boolean;
  day: DaySnapshot;
}

export function celebrationsOf(day: DaySnapshot): Celebration[] {
  return [
    { key: day.key, name: day.name, date: day.date, optional: false, day },
    ...day.optionalMemorials.map((m) => ({ key: m.key, name: m.name, date: day.date, optional: true, day })),
  ];
}

/**
 * The saint of the day: the celebration itself when Pax has an entry for it, otherwise the
 * first optional memorial that has one (a weekday in Ordinary Time often has one).
 */
export async function saintForDay(
  content: Pick<ContentStore, 'saint'>,
  day: DaySnapshot,
): Promise<{ saint: Saint; celebration: Celebration } | null> {
  for (const celebration of celebrationsOf(day)) {
    const saint = await content.saint(celebration.key);
    if (saint) return { saint, celebration };
  }
  return null;
}

const isMartyr = (saint: Saint, celebration?: Celebration) =>
  /martyr/i.test(celebration?.name ?? '') || /martyr/i.test(saint.subtitle ?? '');

/** The day's color when the saint is the celebration, else red for martyrs and white otherwise. */
export function saintColor(saint: Saint, celebration?: Celebration): LiturgicalColor {
  if (celebration && !celebration.optional) return celebration.day.color;
  return isMartyr(saint, celebration) ? 'red' : 'white';
}

/** The rank chip: "Memorial · Martyr", "Optional memorial", "Feast". */
export function rankChip(saint: Saint, celebration?: Celebration): string | null {
  const martyr = isMartyr(saint, celebration);
  const rank = celebration ? (celebration.optional ? 'Optional memorial' : celebration.day.rankName) : null;
  return [rank, martyr && saint.kind !== 'saints' ? 'Martyr' : martyr ? 'Martyrs' : null].filter(Boolean).join(' · ') || null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 17" from YYYY-MM-DD or MM-DD. */
export function shortDate(date: string): string {
  const [m, d] = date.slice(-5).split('-').map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${d}`;
}
