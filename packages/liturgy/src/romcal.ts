import { Romcal, type LiturgicalCalendar, type LiturgicalDay } from 'romcal';
import { UnitedStates_En } from '@romcal/calendar.united-states';

let romcal: Romcal | null = null;
const calendars = new Map<number, Promise<LiturgicalCalendar>>();

function instance(): Romcal {
  // US defaults: Epiphany, Ascension (most provinces) and Corpus Christi move to Sunday,
  // which is what the United States calendar bundle sets.
  romcal ??= new Romcal({ localizedCalendar: UnitedStates_En });
  return romcal;
}

/** One romcal calendar per civil year, generated once and cached (~40 ms each). */
export function calendarFor(year: number): Promise<LiturgicalCalendar> {
  let cal = calendars.get(year);
  if (!cal) {
    cal = instance().generateCalendar(year);
    calendars.set(year, cal);
  }
  return cal;
}

/** Every celebration on a date: romcal lists the default one first, then optional memorials. */
export async function romcalDays(iso: string): Promise<LiturgicalDay[]> {
  const year = Number(iso.slice(0, 4));
  const cal = await calendarFor(year);
  const days = cal[iso] ?? [];
  if (!days.length) throw new Error(`romcal returned no celebration for ${iso}`);
  return days;
}

/** The date (YYYY-MM-DD) a celebration falls on in a civil year, or null if it is impeded. */
export async function dateOfCelebration(key: string, year: number): Promise<string | null> {
  const cal = await calendarFor(year);
  for (const [date, list] of Object.entries(cal)) {
    if (list.some((d) => d.id === key)) return date;
  }
  return null;
}
