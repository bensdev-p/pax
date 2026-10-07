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

export type ReminderSlot = 'evening' | 'morning';

/** Mirrors the `notification_prefs` rows (SPEC: Data model). */
export interface NotificationPrefs {
  dailyReminder: boolean;
  slot: ReminderSlot;
  /** HH:MM, local time. */
  localTime: string;
  angelus: boolean;
}

export interface Settings {
  appearance: Appearance;
  /** A fixed palette, or null to follow the Church year. */
  lockedColor: PaletteName | null;
  /** content.db version last copied to the device. */
  contentVersion: string | null;
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
};

export const REMINDER_TIMES: Record<ReminderSlot, string> = {
  evening: '20:00',
  morning: '07:30',
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dailyReminder: false,
  slot: 'evening',
  localTime: REMINDER_TIMES.evening,
  angelus: false,
};

export const GRACE_DAYS_PER_MONTH = 2;
