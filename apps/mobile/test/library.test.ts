import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { detectFts, type ReadDb, type SqlParam } from '@/data/db';
import { createLibrary, modernLabel, verseLabel, type LibraryStore } from '@/data/library';

const CONTENT = fileURLToPath(new URL('../assets/content/content.db', import.meta.url));

function nodeDb(path: string): Omit<ReadDb, 'hasFts'> {
  const db = new DatabaseSync(path, { readOnly: true });
  return {
    all: async <T,>(sql: string, params: SqlParam[] = []) => db.prepare(sql).all(...params) as T[],
    first: async <T,>(sql: string, params: SqlParam[] = []) => (db.prepare(sql).get(...params) as T) ?? null,
  };
}

let lib: LibraryStore;
let likeLib: LibraryStore;

beforeAll(async () => {
  const base = nodeDb(CONTENT);
  lib = createLibrary({ ...base, hasFts: await detectFts(base) });
  likeLib = createLibrary({ ...base, hasFts: false });
});

describe('Library over content.db', () => {
  it('lists the 73 books with Douay names', async () => {
    const books = await lib.books();
    expect(books).toHaveLength(73);
    expect(books.find((b) => b.osis === '1Kgs')).toMatchObject({ name: '1 Kings', name_douay: '3 Kings' });
  });

  it('reads Psalm 22 in Douay order, keyed by standard numbering', async () => {
    const ch = await lib.chapter('Ps', 22);
    expect(ch?.incipit).toBe('Dominus regit me.');
    expect(ch?.verses[0]).toMatchObject({ ref: 'Ps.23.1', douay_verse: 1, notes: 1 });
    expect(ch?.verses[0]?.text).toContain('The Lord ruleth me');
  });

  it('opens a verse with its labels, notes, Catechism and Fathers (the Phase 2 gate)', async () => {
    const v = await lib.verse('Matt.6.9');
    expect(v && verseLabel(v)).toBe('Matthew 6:9');
    expect(v && modernLabel(v)).toBeNull();
    const ccc = await lib.cccForVerse('Matt.6.9');
    expect(ccc.map((p) => p.number)).toContain(2759);
    expect(ccc[0]?.vatican_url).toMatch(/^https:\/\/www\.vatican\.va\//);
    const fathers = await lib.fathersForVerse('Matt.6.9');
    expect(fathers.length).toBeGreaterThan(0);
    expect(fathers[0]).toHaveProperty('author');
  });

  it('labels Psalms in both numberings', async () => {
    const v = await lib.verse('Ps.23.1');
    expect(v && verseLabel(v)).toBe('Psalms 22:1');
    expect(v && modernLabel(v)).toBe('Psalm 23:1');
  });

  it('opens a Catechism paragraph with the verses it cites', async () => {
    const verses = await lib.cccVerses(2759);
    expect(verses.map((v) => v.ref)).toContain('Luke.11.1');
    const outline = await lib.cccOutline();
    expect(outline[0]?.first).toBe(1);
  });

  it('lists Fathers and their excerpts', async () => {
    const authors = await lib.fatherAuthors();
    const augustine = authors.find((a) => a.slug === 'augustine-of-hippo');
    expect(augustine?.excerpts).toBeGreaterThan(10);
    const excerpts = await lib.fatherExcerpts('augustine-of-hippo', 5);
    expect(excerpts).toHaveLength(5);
    expect(excerpts[0]?.ref).toBeTruthy();
  });

  it('searches with FTS and with the LIKE fallback', async () => {
    const hits = await lib.search('shepherd');
    expect(hits.some((h) => h.kind === 'verse')).toBe(true);
    const like = await likeLib.search('ruleth me');
    expect(like.find((h) => h.kind === 'verse')?.key).toBe('Ps.23.1');
  });

  it('finds the Douay chapter for a lectionary verse', async () => {
    expect(await lib.locate('Ps.23.1')).toEqual({ book: 'Ps', douay_chapter: 22, douay_verse: 1 });
  });
});
