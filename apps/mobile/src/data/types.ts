import type { Appearance, PaletteName } from '@pax/tokens';

export interface Prayer {
  slug: string;
  title: string;
  category: 'essentials' | 'rosary' | 'marian' | 'daily' | string;
  text: string;
  latin_text: string | null;
  sort_order: number;
}

export interface RosaryMystery {
  slug: string;
  mystery_set: 'joyful' | 'luminous' | 'sorrowful' | 'glorious';
  number: number;
  title: string;
  fruit: string;
  scripture_ref: string | null;
  scripture_display: string;
  meditation: string;
}

/** Read-only content from content.db (native) or content.json (web). */
export interface ContentStore {
  version: string;
  prayers(): Promise<Prayer[]>;
  prayer(slug: string): Promise<Prayer | null>;
  mysteries(set: RosaryMystery['mystery_set']): Promise<RosaryMystery[]>;
}

export type ReminderSlot = 'morning' | 'evening';

export interface ReminderTime {
  enabled: boolean;
  /** HH:MM, 24-hour, local time. */
  time: string;
}

/** Mirrors the `notification_prefs` rows (SPEC: Data model). */
export interface NotificationPrefs {
  morning: ReminderTime;
  evening: ReminderTime;
  /** Built-in nudges at fixed times, only on days nothing is done yet. */
  nudges: boolean;
  angelus: boolean;
}

export interface ReadingPosition {
  book: string;
  /** Douay chapter. */
  chapter: number;
}

/** The installed Church Fathers pack: its version and part files. */
export interface FathersPackInstall {
  version: string;
  files: string[];
}

export interface Settings {
  appearance: Appearance;
  /** A fixed palette, or null to follow the Church year. */
  lockedColor: PaletteName | null;
  /** content.db version last copied to the device. */
  contentVersion: string | null;
  /** Where the Bible reader was last open (for "Continue reading"). */
  lastRead: ReadingPosition | null;
  fathersPack: FathersPackInstall | null;
}

export type ActivityKind = 'lesson' | 'readings' | 'prayer';

export interface Progress {
  today: string;
  doneToday: boolean;
  didReadingsToday: boolean;
  didPrayerToday: boolean;
  currentStreak: number;
  longestStreak: number;
  xpToday: number;
  xpTotal: number;
  reviewsDue: number;
  graceDaysLeft: number;
}

/** Local user data (user.db on the phone; browser storage on web). */
export interface UserStore {
  getSettings(): Promise<Settings>;
  setSettings(patch: Partial<Settings>): Promise<Settings>;
  getNotificationPrefs(): Promise<NotificationPrefs>;
  setNotificationPrefs(prefs: NotificationPrefs): Promise<void>;
  recordActivity(localDate: string, kind: ActivityKind, xp?: number): Promise<void>;
  getProgress(localDate: string): Promise<Progress>;
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: 'light',
  lockedColor: null,
  contentVersion: null,
  lastRead: null,
  fathersPack: null,
};

export function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  morning: { enabled: false, time: '07:30' },
  evening: { enabled: false, time: '20:00' },
  nudges: false,
  angelus: false,
};

/** The prefs the Pax screen starts from the first time: evening reminder and nudges on. */
export const SUGGESTED_NOTIFICATION_PREFS: NotificationPrefs = {
  morning: { enabled: false, time: '07:30' },
  evening: { enabled: true, time: '20:00' },
  nudges: true,
  angelus: false,
};

export function anyNotificationsOn(p: NotificationPrefs): boolean {
  return p.morning.enabled || p.evening.enabled || p.nudges || p.angelus;
}

export const GRACE_DAYS_PER_MONTH = 2;
