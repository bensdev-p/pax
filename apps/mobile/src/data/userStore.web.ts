import { isPaletteName } from '@pax/tokens';

import { computeStreak } from './streak';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SETTINGS,
  GRACE_DAYS_PER_MONTH,
  type ActivityKind,
  type NotificationPrefs,
  type Progress,
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
  activity: Record<string, { lesson: boolean; readings: boolean; prayer: boolean; xp: number }>;
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
  };
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
  async recordActivity(localDate: string, kind: ActivityKind, xp = 0) {
    const data = load();
    const day = data.activity[localDate] ?? { lesson: false, readings: false, prayer: false, xp: 0 };
    day[kind] = true;
    day.xp += xp;
    data.activity[localDate] = day;
    save(data);
  },
  async getProgress(localDate: string): Promise<Progress> {
    const data = load();
    const active = Object.entries(data.activity)
      .filter(([, d]) => d.lesson || d.readings || d.prayer)
      .map(([date]) => date);
    const { current, longest } = computeStreak(active, localDate);
    const xpValues = Object.values(data.activity).map((d) => d.xp);
    return {
      today: localDate,
      doneToday: active.includes(localDate),
      didReadingsToday: !!data.activity[localDate]?.readings,
      didPrayerToday: !!data.activity[localDate]?.prayer,
      currentStreak: current,
      longestStreak: longest,
      xpToday: data.activity[localDate]?.xp ?? 0,
      xpTotal: xpValues.reduce((a, b) => a + b, 0),
      reviewsDue: 0,
      graceDaysLeft: GRACE_DAYS_PER_MONTH,
    };
  },
};
