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

export interface SaintFact {
  value: string;
  label: string;
}

/** A saint or feast of the US calendar, keyed by its romcal celebration key. Own-words text. */
export interface Saint {
  romcal_key: string;
  name: string;
  kind: 'saint' | 'saints' | 'mary' | 'lord' | 'angels' | 'church';
  subtitle: string | null;
  dates: string | null;
  patronage: string | null;
  summary: string | null;
  bio: string | null;
  quote: string | null;
  quote_source: string | null;
  facts: SaintFact[];
  /** Church Fathers library authors whose writings are this saint's. */
  fathers: string[];
  /** MM-DD for fixed feasts, null for movable ones. */
  month_day: string | null;
}

/** One screen of a guided devotion. */
export type DevotionStep =
  | { type: 'prayer'; slug: string; note?: string }
  | { type: 'text'; title: string; text: string; note?: string }
  | { type: 'repeat'; title: string; text: string; count: number; note?: string }
  | { type: 'station'; number: number; title: string; citation: string | null; text: string }
  | { type: 'litany'; title: string; groups: { response: string; calls: string[] }[] }
  | { type: 'day' };

export interface NovenaDay {
  title: string;
  intention: string;
  text: string;
}

export interface Devotion {
  slug: string;
  title: string;
  kind: 'chaplet' | 'stations' | 'litany' | 'novena';
  summary: string;
  intro: string;
  /** Season to feature it in: LENT, EASTER or ADVENT. */
  season: string | null;
  minutes: number | null;
  /** Novenas: romcal key of the feast the nine days lead up to. */
  anchor: string | null;
  steps: DevotionStep[];
  days: NovenaDay[] | null;
  sort_order: number;
}

/** Read-only content from content.db. */
export interface ContentStore {
  version: string;
  prayers(): Promise<Prayer[]>;
  prayer(slug: string): Promise<Prayer | null>;
  mysteries(set: RosaryMystery['mystery_set']): Promise<RosaryMystery[]>;
  saint(key: string): Promise<Saint | null>;
  saints(): Promise<Saint[]>;
  devotions(): Promise<Devotion[]>;
  devotion(slug: string): Promise<Devotion | null>;
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

/** Which of the day's readings were read in the app, so the check marks survive a restart. */
export interface ReadingsRead {
  date: string;
  parts: string[];
}

/** A novena in progress (user.db `novena_progress`). */
export interface NovenaProgress {
  slug: string;
  /** The devotion's title, kept so reminders can name it. */
  title: string;
  startedOn: string;
  /** Days prayed so far, 0–9. */
  daysDone: number;
  lastPrayedOn: string | null;
  /** HH:MM daily reminder, or null for none. */
  reminderTime: string | null;
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
  readingsRead: ReadingsRead | null;
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
  getNovenas(): Promise<NovenaProgress[]>;
  saveNovena(novena: NovenaProgress): Promise<void>;
  removeNovena(slug: string): Promise<void>;
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: 'light',
  lockedColor: null,
  contentVersion: null,
  lastRead: null,
  fathersPack: null,
  readingsRead: null,
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
