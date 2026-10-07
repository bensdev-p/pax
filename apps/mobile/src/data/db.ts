/** The read-only SQL surface Pax's content queries need, on any platform. */
export type SqlParam = string | number | null;

export interface ReadDb {
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  first<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
  /** Whether this SQLite build has FTS5 (expo-sqlite does; sql.js on the web does not). */
  hasFts: boolean;
}

/** "bread of life" → `"bread"* "of"* "life"*` (every word, prefix match). */
export function ftsQuery(text: string): string | null {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, 8) ?? [];
  return words.length ? words.map((w) => `"${w}"*`).join(' ') : null;
}

/** The words of a query, for the LIKE fallback. */
export function queryWords(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length > 1).slice(0, 6);
}

/** Checks FTS5 by running a tiny query against the index. */
export async function detectFts(db: Omit<ReadDb, 'hasFts'>): Promise<boolean> {
  try {
    await db.all("SELECT rowid FROM search_index WHERE search_index MATCH 'lord' LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
