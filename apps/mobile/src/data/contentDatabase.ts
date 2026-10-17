import type { SQLiteDatabase } from 'expo-sqlite';

type ContentDatabase = Pick<SQLiteDatabase, 'getAllAsync' | 'getFirstAsync' | 'closeAsync'>;

// Search's FTS tables are optional; the app has a LIKE fallback. These content tables are not.
const REQUIRED_TABLES = [
  'content_meta', 'bible_books', 'bible_verses', 'bible_chapters', 'bible_notes',
  'verse_map', 'verse_aliases', 'ccc_paragraphs', 'father_authors', 'father_works',
  'father_passages', 'saints', 'writings', 'writing_chapters', 'prayers',
  'rosary_mysteries', 'devotions', 'courses', 'course_days', 'units', 'lessons',
  'questions', 'cross_refs', 'lectionary', 'search_docs',
];

export async function validateContentDatabase(db: ContentDatabase, version: string): Promise<void> {
  const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
  const names = new Set(tables.map((t) => t.name));
  const missing = REQUIRED_TABLES.filter((name) => !names.has(name));
  if (missing.length) throw new Error(`Content database is missing tables: ${missing.join(', ')}`);

  const meta = await db.getFirstAsync<{ content_version: string }>('SELECT content_version FROM content_meta');
  if (meta?.content_version !== version) throw new Error('Content database version does not match the bundled content.');

  const check = await db.getAllAsync<{ quick_check: string }>('PRAGMA quick_check');
  if (check.length !== 1 || check[0].quick_check !== 'ok') throw new Error('Content database failed its integrity check.');
}

/** Share one validated connection across mounts/renders; a failed attempt can be retried. */
export function createContentLoader<T extends ContentDatabase>({
  version,
  open,
  replace,
}: {
  version: string;
  open: () => Promise<T>;
  /** Called only after the invalid connection has closed. Must only replace bundled content. */
  replace: () => Promise<void>;
}): () => Promise<T> {
  let loading: Promise<T> | null = null;

  async function openValidated(): Promise<T> {
    const db = await open();
    try {
      await validateContentDatabase(db, version);
      return db;
    } catch (error) {
      // Never replace an open database, including when closing it fails.
      await db.closeAsync();
      throw new InvalidContentError(error);
    }
  }

  return () => {
    loading ??= (async () => {
      try {
        return await openValidated();
      } catch (error) {
        // A close failure must not lead to replacement of the still-open file.
        if (!(error instanceof InvalidContentError)) throw error;
        console.warn('Pax is restoring its bundled content database:', error.cause);
        await replace();
        return openValidated();
      }
    })().catch((error) => {
      loading = null;
      throw error;
    });
    return loading;
  };
}

class InvalidContentError extends Error {
  constructor(public readonly cause: unknown) {
    super('The installed content database needs to be restored.');
  }
}
