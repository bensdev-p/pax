import type { ReadDb } from './db';
import { parseJson, type ContentStore, type Devotion, type DevotionStep, type NovenaDay, type Prayer, type RosaryMystery, type Saint, type SaintFact } from './types';

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

/** Prayers, Rosary mysteries, saints and devotions from content.db, on any platform. */
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
  };
}
