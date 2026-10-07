import type { ReadDb } from './db';
import type { ContentStore, Prayer, RosaryMystery } from './types';

/** Prayers and Rosary mysteries from content.db, on any platform. */
export function createContentStore(db: ReadDb, version: string): ContentStore {
  return {
    version,
    prayers: () => db.all<Prayer>('SELECT * FROM prayers ORDER BY sort_order'),
    prayer: (slug) => db.first<Prayer>('SELECT * FROM prayers WHERE slug = ?', [slug]),
    mysteries: (set) =>
      db.all<RosaryMystery>('SELECT * FROM rosary_mysteries WHERE mystery_set = ? ORDER BY number', [set]),
  };
}
