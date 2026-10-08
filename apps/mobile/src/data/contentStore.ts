import type { ReadDb } from './db';
import {
  parseJson,
  type ContentStore,
  type Course,
  type CourseDay,
  type CourseUnit,
  type Devotion,
  type DevotionStep,
  type NovenaDay,
  type Prayer,
  type RosaryMystery,
  type Saint,
  type SaintFact,
} from './types';

type Row<T, K extends keyof T> = Omit<T, K> & { [P in K]: string | null };

const saintOf = (row: Row<Saint, 'facts' | 'fathers'>): Saint => ({
  ...row,
  facts: parseJson<SaintFact[]>(row.facts) ?? [],
  fathers: parseJson<string[]>(row.fathers) ?? [],
});

const devotionOf = (row: Row<Devotion, 'steps' | 'days'>): Devotion => ({
  ...row,
  steps: parseJson<DevotionStep[]>(row.steps) ?? [],
  days: parseJson<NovenaDay[]>(row.days),
});

const courseOf = (row: Row<Course, 'sections'>): Course => ({ ...row, sections: parseJson<Course['sections']>(row.sections) ?? [] });

const courseDayOf = (row: Row<CourseDay, 'readings' | 'wisdom' | 'see'>): CourseDay => ({
  ...row,
  readings: parseJson<CourseUnit[]>(row.readings) ?? [],
  wisdom: parseJson<CourseUnit[]>(row.wisdom) ?? [],
  see: parseJson<CourseDay['see']>(row.see) ?? [],
});

/** Prayers, Rosary mysteries, saints, devotions and reading plans from content.db, on any platform. */
export function createContentStore(db: ReadDb, version: string): ContentStore {
  return {
    version,
    prayers: () => db.all<Prayer>('SELECT * FROM prayers ORDER BY sort_order'),
    prayer: (slug) => db.first<Prayer>('SELECT * FROM prayers WHERE slug = ?', [slug]),
    mysteries: (set) =>
      db.all<RosaryMystery>('SELECT * FROM rosary_mysteries WHERE mystery_set = ? ORDER BY number', [set]),
    saint: async (key) => {
      const row = await db.first<Row<Saint, 'facts' | 'fathers'>>('SELECT * FROM saints WHERE romcal_key = ?', [key]);
      return row ? saintOf(row) : null;
    },
    saints: async () =>
      (await db.all<Row<Saint, 'facts' | 'fathers'>>('SELECT * FROM saints ORDER BY month_day, name')).map(saintOf),
    devotions: async () =>
      (await db.all<Row<Devotion, 'steps' | 'days'>>('SELECT * FROM devotions ORDER BY sort_order')).map(devotionOf),
    devotion: async (slug) => {
      const row = await db.first<Row<Devotion, 'steps' | 'days'>>('SELECT * FROM devotions WHERE slug = ?', [slug]);
      return row ? devotionOf(row) : null;
    },
    courses: async () => (await db.all<Row<Course, 'sections'>>('SELECT * FROM courses ORDER BY sort_order')).map(courseOf),
    course: async (slug) => {
      const row = await db.first<Row<Course, 'sections'>>('SELECT * FROM courses WHERE slug = ?', [slug]);
      return row ? courseOf(row) : null;
    },
    courseDays: (slug) =>
      db.all('SELECT day, section, title, label FROM course_days WHERE course_slug = ? ORDER BY day', [slug]),
    courseDay: async (slug, day) => {
      const row = await db.first<Row<CourseDay, 'readings' | 'wisdom' | 'see'>>(
        'SELECT * FROM course_days WHERE course_slug = ? AND day = ?',
        [slug, day],
      );
      return row ? courseDayOf(row) : null;
    },
  };
}
