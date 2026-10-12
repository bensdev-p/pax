import { isPaletteName } from '@pax/tokens';

import { buildProgress } from './streak';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SETTINGS,
  type ActivityKind,
  type DayActivity,
  type NotificationPrefs,
  type CourseProgress,
  type NovenaProgress,
  type Settings,
  type UserStore,
} from './types';

/**
 * Web stand-in for user.db: the same data kept in this browser's localStorage. On the web,
 * progress will come from Supabase once sync exists (SPEC: Web).
 */
interface WebData {
  settings: Partial<Settings>;
  prefs: NotificationPrefs;
  /** `lesson` is a day of a reading plan (Study); `xp` is kept from older versions, unused. */
  activity: Record<string, { lesson: boolean; readings: boolean; prayer: boolean; xp?: number; grace?: boolean }>;
  novenas?: Record<string, NovenaProgress>;
  courses?: Record<string, CourseProgress>;
}

const KEY = 'pax.user.v1';

function load(): WebData {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return JSON.parse(raw) as WebData;
  } catch {
    // Private mode or blocked storage: fall through to defaults.
  }
  return { settings: {}, prefs: DEFAULT_NOTIFICATION_PREFS, activity: {} };
}

function save(data: WebData) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(data));
  } catch {
    // Ignore: the session still works, it just won't persist.
  }
}

function settingsOf(data: WebData): Settings {
  const s = data.settings;
  return {
    appearance: s.appearance ?? DEFAULT_SETTINGS.appearance,
    lockedColor: isPaletteName(s.lockedColor) ? s.lockedColor : null,
    contentVersion: s.contentVersion ?? null,
    lastRead: s.lastRead ?? null,
    fathersPack: null,
    readingsRead: s.readingsRead ?? null,
    graceDeclinedFor: s.graceDeclinedFor ?? null,
  };
}

const ACTIVITY_KEYS = { study: 'lesson', readings: 'readings', prayer: 'prayer' } as const;

function daysOf(data: WebData): DayActivity[] {
  return Object.entries(data.activity)
    .map(([date, d]) => ({ date, read: !!d.readings, pray: !!d.prayer, study: !!d.lesson, grace: !!d.grace }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const userStore: UserStore = {
  async getSettings() {
    return settingsOf(load());
  },
  async setSettings(patch) {
    const data = load();
    data.settings = { ...data.settings, ...patch };
    save(data);
    return settingsOf(data);
  },
  async getNotificationPrefs() {
    const prefs = load().prefs as Partial<NotificationPrefs>;
    // Older shape (one daily reminder) or missing: start from the defaults.
    return prefs?.morning && prefs.evening ? (prefs as NotificationPrefs) : DEFAULT_NOTIFICATION_PREFS;
  },
  async setNotificationPrefs(prefs) {
    const data = load();
    data.prefs = prefs;
    save(data);
  },
  async recordActivity(localDate: string, kind: ActivityKind) {
    const data = load();
    const day = data.activity[localDate] ?? { lesson: false, readings: false, prayer: false };
    day[ACTIVITY_KEYS[kind]] = true;
    data.activity[localDate] = day;
    save(data);
  },
  async getProgress(localDate: string) {
    const data = load();
    return buildProgress(daysOf(data), localDate, { declinedFor: settingsOf(data).graceDeclinedFor });
  },
  async getActivity(from: string, to: string) {
    return daysOf(load()).filter((d) => d.date >= from && d.date <= to);
  },
  async applyGraceDays(dates: string[]) {
    const data = load();
    for (const date of dates) {
      data.activity[date] = { ...(data.activity[date] ?? { lesson: false, readings: false, prayer: false }), grace: true };
    }
    save(data);
  },
  async getNovenas() {
    return Object.values(load().novenas ?? {}).sort((a, b) => a.startedOn.localeCompare(b.startedOn));
  },
  async saveNovena(n) {
    const data = load();
    data.novenas = { ...data.novenas, [n.slug]: n };
    save(data);
  },
  async removeNovena(slug) {
    const data = load();
    if (data.novenas) delete data.novenas[slug];
    save(data);
  },
  async getCourses() {
    return Object.values(load().courses ?? {}).sort((a, b) => a.startedOn.localeCompare(b.startedOn));
  },
  async saveCourse(c) {
    const data = load();
    data.courses = { ...data.courses, [c.slug]: c };
    save(data);
  },
  async removeCourse(slug) {
    const data = load();
    if (data.courses) delete data.courses[slug];
    save(data);
  },
};
