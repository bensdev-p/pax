import { isPaletteName } from '@pax/tokens';
import * as SQLite from 'expo-sqlite';

import { computeStreak } from './streak';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SETTINGS,
  GRACE_DAYS_PER_MONTH,
  parseJson,
  type ActivityKind,
  type FathersPackInstall,
  type NotificationPrefs,
  type CourseProgress,
  type NovenaProgress,
  type ReadingPosition,
  type ReadingsRead,
  type Progress,
  type ReminderTime,
  type Settings,
  type UserStore,
} from './types';

/**
 * user.db lives only on this phone, apart from content.db so content updates never touch it.
 * Tables mirror the synced tables in SPEC.md; `user_id` stays 'local' until Supabase sign-in
 * (anonymous first) arrives with sync.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE daily_activity (
    user_id        TEXT NOT NULL DEFAULT 'local',
    local_date     TEXT NOT NULL,
    did_lesson     INTEGER NOT NULL DEFAULT 0,
    did_readings   INTEGER NOT NULL DEFAULT 0,
    did_prayer     INTEGER NOT NULL DEFAULT 0,
    xp             INTEGER NOT NULL DEFAULT 0,
    used_grace_day INTEGER NOT NULL DEFAULT 0,
    updated_at     TEXT NOT NULL,
    PRIMARY KEY (user_id, local_date)
  ) WITHOUT ROWID;

  CREATE TABLE lesson_progress (
    user_id      TEXT NOT NULL DEFAULT 'local',
    lesson_slug  TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    score        REAL,
    xp           INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, lesson_slug)
  ) WITHOUT ROWID;

  CREATE TABLE review_cards (
    user_id       TEXT NOT NULL DEFAULT 'local',
    question_slug TEXT NOT NULL,
    ease          REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    due_at        TEXT NOT NULL,
    PRIMARY KEY (user_id, question_slug)
  ) WITHOUT ROWID;

  CREATE TABLE streaks (
    user_id          TEXT PRIMARY KEY DEFAULT 'local',
    current          INTEGER NOT NULL DEFAULT 0,
    longest          INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,
    grace_days_left  INTEGER NOT NULL DEFAULT ${GRACE_DAYS_PER_MONTH}
  ) WITHOUT ROWID;

  CREATE TABLE notes (
    user_id         TEXT NOT NULL DEFAULT 'local',
    id              TEXT NOT NULL,        -- client-generated UUID
    target_type     TEXT NOT NULL,        -- verse, ccc, father, prayer
    target_key      TEXT NOT NULL,        -- OSIS ref, CCC number or slug
    highlight_color TEXT,
    body            TEXT,
    updated_at      TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
  ) WITHOUT ROWID;

  CREATE TABLE notification_prefs (
    user_id    TEXT NOT NULL DEFAULT 'local',
    type       TEXT NOT NULL,             -- morning_reminder, evening_reminder, streak_nudge, angelus
    enabled    INTEGER NOT NULL,
    local_time TEXT,
    PRIMARY KEY (user_id, type)
  ) WITHOUT ROWID;

  -- Changes waiting to be pushed to Supabase. Nothing is sent until sync is built.
  CREATE TABLE sync_queue (
    seq        INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    row_key    TEXT NOT NULL,
    op         TEXT NOT NULL,
    queued_at  TEXT NOT NULL
  );
  `,
  // 2: one daily reminder became separate morning and evening reminders, plus streak nudges.
  `
  INSERT OR IGNORE INTO notification_prefs (user_id, type, enabled, local_time)
    SELECT user_id, CASE WHEN local_time < '12:00' THEN 'morning_reminder' ELSE 'evening_reminder' END, enabled, local_time
    FROM notification_prefs WHERE type = 'daily_reminder';
  DELETE FROM notification_prefs WHERE type = 'daily_reminder';
  `,
  // 3: novenas in progress, with an optional daily reminder.
  `
  CREATE TABLE novena_progress (
    user_id        TEXT NOT NULL DEFAULT 'local',
    slug           TEXT NOT NULL,         -- devotions.slug in content.db
    title          TEXT NOT NULL,         -- for the reminder text
    started_on     TEXT NOT NULL,
    days_done      INTEGER NOT NULL DEFAULT 0,
    last_prayed_on TEXT,
    reminder_time  TEXT,                  -- HH:MM, or NULL for no reminder
    PRIMARY KEY (user_id, slug)
  ) WITHOUT ROWID;
  `,
  // 4: reading plans in progress, with an optional daily reminder.
  `
  CREATE TABLE course_progress (
    user_id       TEXT NOT NULL DEFAULT 'local',
    slug          TEXT NOT NULL,          -- courses.slug in content.db
    title         TEXT NOT NULL,          -- for the reminder text
    days          INTEGER NOT NULL,       -- days in the plan
    started_on    TEXT NOT NULL,
    days_done     INTEGER NOT NULL DEFAULT 0,
    last_done_on  TEXT,
    reminder_time TEXT,                   -- HH:MM, or NULL for no reminder
    PRIMARY KEY (user_id, slug)
  ) WITHOUT ROWID;
  `,
];

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version]!;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    version++;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

let opening: Promise<SQLite.SQLiteDatabase> | null = null;
function userDb() {
  opening ??= SQLite.openDatabaseAsync('user.db').then(async (db) => {
    await migrate(db);
    return db;
  });
  return opening;
}

const now = () => new Date().toISOString();

async function readSettings(db: SQLite.SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    appearance:
      map.appearance === 'dark' || map.appearance === 'system' ? map.appearance : DEFAULT_SETTINGS.appearance,
    lockedColor: isPaletteName(map.lockedColor) ? map.lockedColor : null,
    contentVersion: map.contentVersion ?? null,
    lastRead: parseJson<ReadingPosition>(map.lastRead),
    fathersPack: parseJson<FathersPackInstall>(map.fathersPack),
    readingsRead: parseJson<ReadingsRead>(map.readingsRead),
  };
}

export const userStore: UserStore = {
  async getSettings() {
    return readSettings(await userDb());
  },

  async setSettings(patch) {
    const db = await userDb();
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined) {
        await db.runAsync('DELETE FROM settings WHERE key = ?', key);
      } else {
        const stored = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, stored);
      }
    }
    return readSettings(db);
  },

  async getNotificationPrefs() {
    const db = await userDb();
    const rows = await db.getAllAsync<{ type: string; enabled: number; local_time: string | null }>(
      "SELECT type, enabled, local_time FROM notification_prefs WHERE user_id = 'local'",
    );
    const row = (type: string) => rows.find((r) => r.type === type);
    const time = (type: string, fallback: ReminderTime) => ({
      enabled: !!row(type)?.enabled,
      time: row(type)?.local_time ?? fallback.time,
    });
    return {
      morning: time('morning_reminder', DEFAULT_NOTIFICATION_PREFS.morning),
      evening: time('evening_reminder', DEFAULT_NOTIFICATION_PREFS.evening),
      nudges: !!row('streak_nudge')?.enabled,
      angelus: !!row('angelus')?.enabled,
    };
  },

  async setNotificationPrefs(prefs: NotificationPrefs) {
    const db = await userDb();
    const upsert = (type: string, enabled: boolean, localTime: string | null) =>
      db.runAsync(
        "INSERT OR REPLACE INTO notification_prefs (user_id, type, enabled, local_time) VALUES ('local', ?, ?, ?)",
        type,
        enabled ? 1 : 0,
        localTime,
      );
    await db.withTransactionAsync(async () => {
      await upsert('morning_reminder', prefs.morning.enabled, prefs.morning.time);
      await upsert('evening_reminder', prefs.evening.enabled, prefs.evening.time);
      await upsert('streak_nudge', prefs.nudges, null);
      await upsert('angelus', prefs.angelus, '12:00');
      await db.runAsync(
        "INSERT INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('notification_prefs', 'local', 'upsert', ?)",
        now(),
      );
    });
  },

  async recordActivity(localDate: string, kind: ActivityKind, xp = 0) {
    const db = await userDb();
    const column = { lesson: 'did_lesson', readings: 'did_readings', prayer: 'did_prayer' }[kind];
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO daily_activity (user_id, local_date, ${column}, xp, updated_at)
         VALUES ('local', ?, 1, ?, ?)
         ON CONFLICT (user_id, local_date) DO UPDATE SET ${column} = 1, xp = xp + excluded.xp, updated_at = excluded.updated_at`,
        localDate,
        xp,
        now(),
      );
      const dates = await db.getAllAsync<{ local_date: string }>(
        "SELECT local_date FROM daily_activity WHERE user_id = 'local' AND (did_lesson OR did_readings OR did_prayer OR used_grace_day)",
      );
      const { current, longest } = computeStreak(
        dates.map((d) => d.local_date),
        localDate,
      );
      await db.runAsync(
        `INSERT INTO streaks (user_id, current, longest, last_active_date) VALUES ('local', ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET current = excluded.current, longest = MAX(longest, excluded.longest), last_active_date = excluded.last_active_date`,
        current,
        longest,
        localDate,
      );
      await db.runAsync(
        "INSERT INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('daily_activity', ?, 'upsert', ?)",
        localDate,
        now(),
      );
    });
  },

  async getProgress(localDate: string): Promise<Progress> {
    const db = await userDb();
    const dates = await db.getAllAsync<{ local_date: string; xp: number }>(
      "SELECT local_date, xp FROM daily_activity WHERE user_id = 'local' AND (did_lesson OR did_readings OR did_prayer OR used_grace_day)",
    );
    const xp = await db.getFirstAsync<{ total: number | null; today: number | null }>(
      "SELECT SUM(xp) AS total, SUM(CASE WHEN local_date = ? THEN xp ELSE 0 END) AS today FROM daily_activity WHERE user_id = 'local'",
      localDate,
    );
    const due = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM review_cards WHERE user_id = 'local' AND due_at <= ?",
      now(),
    );
    const todayRow = await db.getFirstAsync<{ did_readings: number; did_prayer: number }>(
      "SELECT did_readings, did_prayer FROM daily_activity WHERE user_id = 'local' AND local_date = ?",
      localDate,
    );
    const streakRow = await db.getFirstAsync<{ longest: number; grace_days_left: number }>(
      "SELECT longest, grace_days_left FROM streaks WHERE user_id = 'local'",
    );
    const { current, longest } = computeStreak(
      dates.map((d) => d.local_date),
      localDate,
    );
    return {
      today: localDate,
      doneToday: dates.some((d) => d.local_date === localDate),
      didReadingsToday: !!todayRow?.did_readings,
      didPrayerToday: !!todayRow?.did_prayer,
      currentStreak: current,
      longestStreak: Math.max(longest, streakRow?.longest ?? 0),
      xpToday: xp?.today ?? 0,
      xpTotal: xp?.total ?? 0,
      reviewsDue: due?.n ?? 0,
      graceDaysLeft: streakRow?.grace_days_left ?? GRACE_DAYS_PER_MONTH,
    };
  },

  async getNovenas() {
    const db = await userDb();
    const rows = await db.getAllAsync<{
      slug: string;
      title: string;
      started_on: string;
      days_done: number;
      last_prayed_on: string | null;
      reminder_time: string | null;
    }>("SELECT slug, title, started_on, days_done, last_prayed_on, reminder_time FROM novena_progress WHERE user_id = 'local' ORDER BY started_on");
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      startedOn: r.started_on,
      daysDone: r.days_done,
      lastPrayedOn: r.last_prayed_on,
      reminderTime: r.reminder_time,
    }));
  },

  async saveNovena(n: NovenaProgress) {
    const db = await userDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO novena_progress (user_id, slug, title, started_on, days_done, last_prayed_on, reminder_time)
       VALUES ('local', ?, ?, ?, ?, ?, ?)`,
      n.slug,
      n.title,
      n.startedOn,
      n.daysDone,
      n.lastPrayedOn,
      n.reminderTime,
    );
  },

  async removeNovena(slug: string) {
    const db = await userDb();
    await db.runAsync("DELETE FROM novena_progress WHERE user_id = 'local' AND slug = ?", slug);
  },

  async getCourses() {
    const db = await userDb();
    const rows = await db.getAllAsync<{
      slug: string;
      title: string;
      days: number;
      started_on: string;
      days_done: number;
      last_done_on: string | null;
      reminder_time: string | null;
    }>("SELECT slug, title, days, started_on, days_done, last_done_on, reminder_time FROM course_progress WHERE user_id = 'local' ORDER BY started_on");
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      days: r.days,
      startedOn: r.started_on,
      daysDone: r.days_done,
      lastDoneOn: r.last_done_on,
      reminderTime: r.reminder_time,
    }));
  },

  async saveCourse(c: CourseProgress) {
    const db = await userDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO course_progress (user_id, slug, title, days, started_on, days_done, last_done_on, reminder_time)
       VALUES ('local', ?, ?, ?, ?, ?, ?, ?)`,
      c.slug,
      c.title,
      c.days,
      c.startedOn,
      c.daysDone,
      c.lastDoneOn,
      c.reminderTime,
    );
  },

  async removeCourse(slug: string) {
    const db = await userDb();
    await db.runAsync("DELETE FROM course_progress WHERE user_id = 'local' AND slug = ?", slug);
  },
};
