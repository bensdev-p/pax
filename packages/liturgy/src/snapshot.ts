import type { LiturgicalDay } from 'romcal';

import { addDays, dayOfWeek, toIsoDate, usccbReadingsUrl, type DateInput } from './dates';
import { lookupReadings } from './lectionary';
import { romcalDay } from './romcal';
import type {
  DaySnapshot,
  LiturgicalColor,
  Rank,
  Season,
  SundayCycle,
  WeekdayCycle,
} from './types';

const COLOR_MAP: Record<string, LiturgicalColor> = {
  GREEN: 'green',
  PURPLE: 'violet',
  ROSE: 'rose',
  WHITE: 'white',
  GOLD: 'white',
  RED: 'red',
  BLACK: 'black',
};

export const SEASON_NAMES: Record<Season, string> = {
  ADVENT: 'Advent',
  CHRISTMAS_TIME: 'Christmas',
  LENT: 'Lent',
  PASCHAL_TRIDUUM: 'Triduum',
  EASTER_TIME: 'Easter',
  ORDINARY_TIME: 'Ordinary Time',
};

const SUNDAY_CYCLES: Record<string, SundayCycle> = { YEAR_A: 'A', YEAR_B: 'B', YEAR_C: 'C' };
const WEEKDAY_CYCLES: Record<string, WeekdayCycle> = { YEAR_1: 'I', YEAR_2: 'II' };

/** Everything the app, widgets and server need to know about one day of the Church year. */
export async function getDaySnapshot(date: DateInput): Promise<DaySnapshot> {
  const iso = toIsoDate(date);
  return toSnapshot(iso, await romcalDay(iso));
}

/** `count` consecutive snapshots starting at `start` (the widget feed uses 14). */
export async function getDaySnapshots(start: DateInput, count: number): Promise<DaySnapshot[]> {
  const first = toIsoDate(start);
  const dates = Array.from({ length: count }, (_, i) => addDays(first, i));
  return Promise.all(dates.map((d) => getDaySnapshot(d)));
}

function toSnapshot(iso: string, day: LiturgicalDay): DaySnapshot {
  const colors = day.colors.map((c) => COLOR_MAP[c] ?? 'green');
  // Easter Sunday is listed in both the Triduum and Easter Time; the later season wins.
  const season = (day.seasons[day.seasons.length - 1] ?? 'ORDINARY_TIME') as Season;
  const rank = day.rank as Rank;
  const sundayCycle = SUNDAY_CYCLES[day.cycles.sundayCycle] ?? 'A';
  const weekdayCycle = WEEKDAY_CYCLES[day.cycles.weekdayCycle] ?? 'I';
  const saintKeys = day.martyrology.map((m) => m.id);
  const weekdayKey = day.weekday?.id ?? null;
  const { readings, cycle } = lookupReadings({
    key: day.id,
    weekdayKey,
    rank,
    sundayCycle,
    weekdayCycle,
  });

  return {
    date: iso,
    dayOfWeek: dayOfWeek(iso),
    key: day.id,
    name: capitalize(day.name),
    rank,
    rankName: capitalize(day.rankName),
    isHolyDayOfObligation: day.isHolyDayOfObligation,
    season,
    seasonName: SEASON_NAMES[season],
    weekOfSeason: day.calendar.weekOfSeason,
    color: colors[0] ?? 'green',
    colors,
    saintKey: saintKeys[0] ?? null,
    saintKeys,
    isMartyr: hasMartyrTitle(day),
    weekdayKey,
    sundayCycle,
    weekdayCycle,
    lectionaryCycle: cycle,
    readings,
    usccbUrl: usccbReadingsUrl(iso),
  };
}

function hasMartyrTitle(day: LiturgicalDay): boolean {
  const titles = [
    ...flattenTitles(day.titles),
    ...day.martyrology.flatMap((m) => flattenTitles(m.titles)),
  ];
  return titles.includes('MARTYR');
}

/** romcal titles are a list, or a compound `{ append, prepend }` object on some days. */
function flattenTitles(titles: unknown): string[] {
  if (Array.isArray(titles)) return titles.filter((t): t is string => typeof t === 'string');
  if (titles && typeof titles === 'object') {
    return Object.values(titles).flatMap((v) => flattenTitles(v));
  }
  return [];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
