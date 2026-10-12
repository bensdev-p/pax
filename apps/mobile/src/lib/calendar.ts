import { addDays } from '@pax/liturgy';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Day of the week (0 = Sunday) of an ISO date, independent of the phone's time zone. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function weekdayName(date: string): string {
  return WEEKDAYS[weekdayOf(date)]!;
}

/** "Sunday", "Saturday and Sunday", "Friday, Saturday and Sunday". */
export function weekdayList(dates: string[]): string {
  const names = dates.map(weekdayName);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** "2026-10" plus `delta` months. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** The ISO dates of a month ("2026-10"). */
export function datesOfMonth(month: string): string[] {
  const first = `${month}-01`;
  const dates: string[] = [];
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) dates.push(d);
  return dates;
}

/** Weeks (Sunday first) of a month for a calendar grid; days outside the month are null. */
export function monthGrid(month: string): (string | null)[][] {
  const dates = datesOfMonth(month);
  const cells: (string | null)[] = [...Array<null>(weekdayOf(dates[0]!)).fill(null), ...dates];
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "October 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
