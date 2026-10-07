/** Accepts a Date (read in local time) or a YYYY-MM-DD string. */
export type DateInput = Date | string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toIsoDate(input: DateInput): string {
  if (typeof input === 'string') {
    if (!ISO_DATE.test(input)) throw new Error(`Expected YYYY-MM-DD, got "${input}"`);
    return input;
  }
  const y = input.getFullYear();
  const m = String(input.getMonth() + 1).padStart(2, '0');
  const d = String(input.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = parseIso(iso);
  // Noon UTC avoids any DST edge when stepping by whole days.
  const date = new Date(Date.UTC(y, m - 1, d + days, 12));
  return date.toISOString().slice(0, 10);
}

export function dayOfWeek(iso: string): number {
  const [y, m, d] = parseIso(iso);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function parseIso(iso: string): [number, number, number] {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`Expected YYYY-MM-DD, got "${iso}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** https://bible.usccb.org/bible/readings/MMDDYY.cfm */
export function usccbReadingsUrl(iso: string): string {
  const [y, m, d] = parseIso(iso);
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  const yy = String(y % 100).padStart(2, '0');
  return `https://bible.usccb.org/bible/readings/${mm}${dd}${yy}.cfm`;
}
