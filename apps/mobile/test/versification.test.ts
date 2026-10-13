import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import type { ReadDb, SqlParam } from '@/data/db';
import { createLibrary, type LibraryStore } from '@/data/library';
import { makeNote, renumbered } from '@/lib/notes';

const CONTENT = fileURLToPath(new URL('../assets/content/content.db', import.meta.url));
const wrap = (raw: DatabaseSync): ReadDb => ({
  all: async <T,>(sql: string, params: SqlParam[] = []) => raw.prepare(sql).all(...params) as T[],
  first: async <T,>(sql: string, params: SqlParam[] = []) => (raw.prepare(sql).get(...params) as T) ?? null,
  hasFts: false,
});

let content: ReadDb;
let library: LibraryStore;
beforeAll(() => {
  content = wrap(new DatabaseSync(CONTENT, { readOnly: true }));
  library = createLibrary(content);
});

describe('Douay-Rheims verse divisions in the New Testament', () => {
  it('keys John 6 by modern numbers, with Douay 6:52 as the second half of 6:51', async () => {
    expect((await library.verse('John.6.68'))?.text).toContain('to whom shall we go');
    expect(await library.verse('John.6.51!b')).toMatchObject({ chapter: 6, verse: 51, douay_verse: 52 });
    const [reading] = await library.passage('John 6:51-58');
    expect(reading!.map((v) => v.douay_verse)).toEqual([51, 52, 53, 54, 55, 56, 57, 58, 59]);
  });

  it('opens a modern verse the Douay folds into another', async () => {
    expect((await library.verse('Mark.4.41'))?.ref).toBe('Mark.4.40');
    expect(await library.locate('Acts.7.56')).toEqual({ book: 'Acts', douay_chapter: 7, douay_verse: 55 });
  });

  it('gathers a downloaded Father’s comment on a folded verse onto the Douay verse', async () => {
    const pack = new DatabaseSync(':memory:');
    pack.exec(`
      CREATE TABLE father_authors (slug TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER, category TEXT, wiki TEXT);
      CREATE TABLE father_works (slug TEXT PRIMARY KEY, author_slug TEXT NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL, era TEXT, source_volume TEXT);
      CREATE TABLE father_passages (slug TEXT PRIMARY KEY, work_slug TEXT NOT NULL, author_slug TEXT NOT NULL, year INTEGER, chapter TEXT, text TEXT NOT NULL);
      CREATE TABLE cross_refs (from_type TEXT, from_key TEXT, to_type TEXT, to_key TEXT);
      INSERT INTO father_authors VALUES ('bede', 'Bede', 735, NULL, NULL);
      INSERT INTO father_works VALUES ('w', 'bede', 'Bede', 'On Mark', NULL, NULL);
      INSERT INTO father_passages VALUES ('bede-0000000001', 'w', 'bede', 735, NULL, 'Who is this, that the wind and sea obey him?');
      INSERT INTO cross_refs VALUES ('father', 'bede-0000000001', 'verse', 'Mark.4.41');
    `);
    const lib = createLibrary(content, () => [wrap(pack)]);
    expect((await lib.fathersForVerse('Mark.4.40')).map((f) => f.slug)).toEqual(['bede-0000000001']);
    const places = await lib.douayPlaces('Mark');
    expect(places.find((p) => p.ref === 'Mark.4.41')).toMatchObject({ douay_chapter: 4, douay_verse: 40 });
  });

  it('moves notes on renamed verses to their new keys', async () => {
    const renames = await library.verseRenames();
    expect(renames['John.6.69']).toBe('John.6.68');
    expect(renames['John.6.52']).toBe('John.6.51!b');
    expect(renames['Mark.8.39']).toBe('Mark.9.1');
    expect(renames['John.3.16']).toBeUndefined();
    const notes = [
      makeNote({ kind: 'highlight', targetType: 'verse', targetKey: 'John.6.69', highlightColor: 'yellow' }),
      makeNote({ kind: 'bookmark', targetType: 'verse', targetKey: 'John.3.16' }),
      makeNote({ kind: 'favorite', targetType: 'prayer', targetKey: 'John.6.69' }),
    ];
    expect(renumbered(notes, renames).map((n) => [n.kind, n.targetKey])).toEqual([['highlight', 'John.6.68']]);
  });
});
