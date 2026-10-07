import type { DaySnapshot } from '@pax/liturgy';

import type { PaxMood } from '@/components/Pax';

/**
 * The data home-screen widgets read (SPEC: Widgets). The app writes the next 14 DaySnapshots
 * plus today's progress whenever it opens or something is finished; widgets never run romcal.
 */
export interface WidgetProgress {
  date: string;
  currentStreak: number;
  doneToday: boolean;
  xpToday: number;
  xpGoal: number;
}

export interface WidgetDay {
  date: string;
  key: string;
  name: string;
  rankName: string;
  seasonName: string;
  color: DaySnapshot['color'];
  isMartyr: boolean;
  saintKey: string | null;
  readingCount: number;
  readings: DaySnapshot['readings'];
  /** Deep link the widget opens. */
  url: string;
}

export interface WidgetFeed {
  schemaVersion: 1;
  writtenAt: string;
  days: WidgetDay[];
  progress: WidgetProgress;
  /** Pax's mood through the day: a widget shows the last entry whose time has passed. */
  paxTimeline: { at: string; mood: PaxMood }[];
}

/** Where the feed goes. Implemented per platform once widgets exist. */
export interface WidgetFeedWriter {
  /** Writes the feed into storage widgets can read (the App Group on iOS). */
  write(feed: WidgetFeed): Promise<void>;
  /** Asks the OS to redraw the widgets. */
  reloadWidgets(): Promise<void>;
}

/**
 * Expo Go can't host widgets or write to an App Group, so for now the feed goes nowhere.
 * With an EAS development build this becomes an App Group writer (iOS, via expo-widgets) and
 * a SharedPreferences writer (Android), behind this same interface.
 */
export const noopWidgetFeedWriter: WidgetFeedWriter = {
  async write() {},
  async reloadWidgets() {},
};

let writer: WidgetFeedWriter = noopWidgetFeedWriter;
let lastFeed: WidgetFeed | null = null;

export function setWidgetFeedWriter(next: WidgetFeedWriter) {
  writer = next;
}

/** For debugging in Expo Go: the last feed that would have been written. */
export function getLastWidgetFeed() {
  return lastFeed;
}

export const APP_GROUP = 'group.com.benbrunson.pax';
export const DAILY_XP_GOAL = 30;

export function buildWidgetFeed(snapshots: DaySnapshot[], progress: WidgetProgress, now = new Date()): WidgetFeed {
  const days = snapshots.map<WidgetDay>((s) => ({
    date: s.date,
    key: s.key,
    name: s.name,
    rankName: s.rankName,
    seasonName: s.seasonName,
    color: s.color,
    isMartyr: s.isMartyr,
    saintKey: s.saintKey,
    readingCount: s.readings ? (s.readings.secondReading ? 4 : 3) : 0,
    readings: s.readings,
    url: 'paxapp://today',
  }));
  return {
    schemaVersion: 1,
    writtenAt: now.toISOString(),
    days,
    progress,
    paxTimeline: paxTimeline(snapshots.map((s) => s.date), progress),
  };
}

/** Hello in the morning, encouraging in the evening, asleep at night; happy once today is done. */
export function paxTimeline(dates: string[], progress: WidgetProgress): WidgetFeed['paxTimeline'] {
  const entries: WidgetFeed['paxTimeline'] = [];
  for (const date of dates) {
    const done = date === progress.date && progress.doneToday;
    entries.push({ at: `${date}T00:00`, mood: 'asleep' });
    entries.push({ at: `${date}T07:00`, mood: done ? 'happy' : 'hello' });
    entries.push({ at: `${date}T18:00`, mood: done ? 'happy' : 'encouraging' });
    entries.push({ at: `${date}T22:00`, mood: done ? 'happy' : 'asleep' });
  }
  return entries;
}

export async function writeWidgetFeed(snapshots: DaySnapshot[], progress: WidgetProgress): Promise<WidgetFeed> {
  const feed = buildWidgetFeed(snapshots, progress);
  lastFeed = feed;
  await writer.write(feed);
  await writer.reloadWidgets();
  return feed;
}
