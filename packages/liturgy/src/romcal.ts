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

/** The celebration of the day: romcal lists the default one first, then optional memorials. */
export async function romcalDay(iso: string): Promise<LiturgicalDay> {
  const year = Number(iso.slice(0, 4));
  const cal = await calendarFor(year);
  const day = cal[iso]?.[0];
  if (!day) throw new Error(`romcal returned no celebration for ${iso}`);
  return day;
}
