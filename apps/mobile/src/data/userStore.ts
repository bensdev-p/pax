import { isPaletteName } from '@pax/tokens';
import * as SQLite from 'expo-sqlite';

import { buildProgress, computeStreak, graceDaysLeft, isActive } from './streak';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SETTINGS,
  GRACE_DAYS_PER_MONTH,
  parseJson,
  type ActivityKind,
  type DayActivity,
  type FathersPackInstall,
  type NotificationPrefs,
  type CourseProgress,
  type Note,
  type NoteQuery,
  type NovenaProgress,
  type PrayedToday,
  type ReadingPosition,
  type ReadingsRead,
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
  // 5: notes become the journal, highlights, bookmarks and favorites (SPEC: Phase 3).
  `
  ALTER TABLE notes ADD COLUMN kind TEXT NOT NULL DEFAULT 'journal';  -- journal, highlight, bookmark, favorite
  ALTER TABLE notes ADD COLUMN prompt TEXT;                            -- Pax's question, for answers
  ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';        -- JSON array of tags
  ALTER TABLE notes ADD COLUMN created_at TEXT;
  CREATE INDEX notes_target ON notes (user_id, target_type, target_key);
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
    graceDeclinedFor: map.graceDeclinedFor ?? null,
    onboarded: map.onboarded === 'true',
    studyInRhythm: map.studyInRhythm !== 'false',
    prayedToday: parseJson<PrayedToday>(map.prayedToday),
  };
}

interface ActivityRow {
  local_date: string;
  did_lesson: number;
  did_readings: number;
  did_prayer: number;
  used_grace_day: number;
}

const ACTIVITY_COLUMNS = 'local_date, did_lesson, did_readings, did_prayer, used_grace_day';

/** `did_lesson` predates the rhythm: it now means a day of a reading plan (Study). */
const toDay = (r: ActivityRow): DayActivity => ({
  date: r.local_date,
  read: !!r.did_readings,
  pray: !!r.did_prayer,
  study: !!r.did_lesson,
  grace: !!r.used_grace_day,
});

async function allActivity(db: SQLite.SQLiteDatabase): Promise<DayActivity[]> {
  const rows = await db.getAllAsync<ActivityRow>(
    `SELECT ${ACTIVITY_COLUMNS} FROM daily_activity WHERE user_id = 'local' ORDER BY local_date`,
  );
  return rows.map(toDay);
}

/** Recomputes the cached `streaks` row (read by sync later; the app computes from activity). */
async function saveStreak(db: SQLite.SQLiteDatabase, localDate: string) {
  const days = await allActivity(db);
  const { current, longest } = computeStreak(days.filter(isActive).map((d) => d.date), localDate);
  await db.runAsync(
    `INSERT INTO streaks (user_id, current, longest, last_active_date, grace_days_left) VALUES ('local', ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET current = excluded.current, longest = MAX(longest, excluded.longest),
       last_active_date = excluded.last_active_date, grace_days_left = excluded.grace_days_left`,
    current,
    longest,
    localDate,
    graceDaysLeft(days, localDate),
  );
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

  async recordActivity(localDate: string, kind: ActivityKind) {
    const db = await userDb();
    const column = { study: 'did_lesson', readings: 'did_readings', prayer: 'did_prayer' }[kind];
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO daily_activity (user_id, local_date, ${column}, updated_at)
         VALUES ('local', ?, 1, ?)
         ON CONFLICT (user_id, local_date) DO UPDATE SET ${column} = 1, updated_at = excluded.updated_at`,
        localDate,
        now(),
      );
      await saveStreak(db, localDate);
      await db.runAsync(
        "INSERT INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('daily_activity', ?, 'upsert', ?)",
        localDate,
        now(),
      );
    });
  },

  async getProgress(localDate: string) {
    const db = await userDb();
    const [days, settings, streakRow] = await Promise.all([
      allActivity(db),
      readSettings(db),
      db.getFirstAsync<{ longest: number }>("SELECT longest FROM streaks WHERE user_id = 'local'"),
    ]);
    return buildProgress(days, localDate, {
      declinedFor: settings.graceDeclinedFor,
      storedLongest: streakRow?.longest,
    });
  },

  async getActivity(from: string, to: string) {
    const db = await userDb();
    const rows = await db.getAllAsync<ActivityRow>(
      `SELECT ${ACTIVITY_COLUMNS} FROM daily_activity WHERE user_id = 'local' AND local_date BETWEEN ? AND ? ORDER BY local_date`,
      from,
      to,
    );
    return rows.map(toDay);
  },

  async applyGraceDays(dates: string[]) {
    const db = await userDb();
    await db.withTransactionAsync(async () => {
      for (const date of dates) {
        await db.runAsync(
          `INSERT INTO daily_activity (user_id, local_date, used_grace_day, updated_at) VALUES ('local', ?, 1, ?)
           ON CONFLICT (user_id, local_date) DO UPDATE SET used_grace_day = 1, updated_at = excluded.updated_at`,
          date,
          now(),
        );
        await db.runAsync(
          "INSERT INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('daily_activity', ?, 'upsert', ?)",
          date,
          now(),
        );
      }
      const last = dates.at(-1);
      if (last) await saveStreak(db, last);
    });
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

  async getNotes(query: NoteQuery = {}) {
    const db = await userDb();
    const filters = [
      ['kind', query.kind],
      ['target_type', query.targetType],
      ['target_key', query.targetKey],
    ].filter((f): f is [string, string] => !!f[1]);
    const where = ["user_id = 'local'", ...filters.map(([col]) => `${col} = ?`)];
    const params = filters.map(([, value]) => value);
    const rows = await db.getAllAsync<NoteRow>(
      `SELECT id, kind, target_type, target_key, highlight_color, body, prompt, tags, created_at, updated_at
       FROM notes WHERE ${where.join(' AND ')} ORDER BY COALESCE(created_at, updated_at) DESC`,
      ...params,
    );
    return rows.map(toNote);
  },

  async saveNote(n: Note) {
    const db = await userDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO notes (user_id, id, kind, target_type, target_key, highlight_color, body, prompt, tags, created_at, updated_at)
         VALUES ('local', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        n.id,
        n.kind,
        n.targetType,
        n.targetKey,
        n.highlightColor,
        n.body,
        n.prompt,
        JSON.stringify(n.tags),
        n.createdAt,
        n.updatedAt,
      );
      await db.runAsync("INSERT INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('notes', ?, 'upsert', ?)", n.id, now());
    });
  },

  async deleteNote(id: string) {
    const db = await userDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM notes WHERE user_id = 'local' AND id = ?", id);
      await db.runAsync("INSERT INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('notes', ?, 'delete', ?)", id, now());
    });
  },
};

interface NoteRow {
  id: string;
  kind: Note['kind'];
  target_type: Note['targetType'];
  target_key: string;
  highlight_color: string | null;
  body: string | null;
  prompt: string | null;
  tags: string;
  created_at: string | null;
  updated_at: string;
}

const toNote = (r: NoteRow): Note => ({
  id: r.id,
  kind: r.kind,
  targetType: r.target_type,
  targetKey: r.target_key,
  highlightColor: r.highlight_color,
  body: r.body,
  prompt: r.prompt,
  tags: parseJson<string[]>(r.tags) ?? [],
  createdAt: r.created_at ?? r.updated_at,
  updatedAt: r.updated_at,
});
