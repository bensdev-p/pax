import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import type { ReadDb, SqlParam } from '@/data/db';
import { createLibrary, type FatherAuthor, type LibraryStore } from '@/data/library';
import { booksOf, chaptersOf, diedLabel, eraOf, fathersInEra, mostQuoted, saintFor, searchFathers, shade, versesOf } from '@/lib/fathers';

const CONTENT = fileURLToPath(new URL('../assets/content/content.db', import.meta.url));

const wrap = (raw: DatabaseSync): ReadDb =>
  ({
    all: async <T,>(sql: string, params: SqlParam[] = []) => raw.prepare(sql).all(...params) as T[],
    first: async <T,>(sql: string, params: SqlParam[] = []) => (raw.prepare(sql).get(...params) as T) ?? null,
    hasFts: false,
  }) as ReadDb;

let content: ReadDb;
let library: LibraryStore;

beforeAll(() => {
  content = wrap(new DatabaseSync(CONTENT, { readOnly: true }));
  library = createLibrary(content);
});

const author = (slug: string, name: string, year: number | null, excerpts = 1, also: string[] = []): FatherAuthor => ({
  slug,
  name,
  also,
  year,
  category: null,
  excerpts,
});

describe('Church Fathers directory', () => {
  it('names every Father by the familiar name and keeps the others', async () => {
    const all = await library.fatherAuthors();
    const gregory = all.find((a) => a.slug === 'gregory-the-dialogist');
    expect(gregory).toMatchObject({ name: 'Gregory the Great', also: ['Pope Gregory I', 'Gregory the Dialogist'] });
    expect(all.find((a) => a.slug === 'augustine-of-hippo')?.also).toEqual([]);
  });

  it('renames Fathers from a downloaded library that still has the source’s names', async () => {
    const pack = new DatabaseSync(':memory:');
    pack.exec(`
      CREATE TABLE father_authors (slug TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER, category TEXT, wiki TEXT);
      CREATE TABLE father_works (slug TEXT PRIMARY KEY, author_slug TEXT NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL, era TEXT, source_volume TEXT);
      CREATE TABLE father_passages (slug TEXT PRIMARY KEY, work_slug TEXT NOT NULL, author_slug TEXT NOT NULL, year INTEGER, chapter TEXT, text TEXT NOT NULL);
      CREATE TABLE cross_refs (from_type TEXT, from_key TEXT, to_type TEXT, to_key TEXT);
      INSERT INTO father_authors VALUES ('gregory-the-dialogist', 'Gregory the Dialogist', 604, NULL, NULL);
      INSERT INTO father_works VALUES ('w', 'gregory-the-dialogist', 'Gregory the Dialogist', 'Homilies on the Gospels', NULL, NULL);
      INSERT INTO father_passages VALUES ('gregory-the-dialogist-0123456789', 'w', 'gregory-the-dialogist', 604, NULL, 'The Lord sends them two by two.');
      INSERT INTO cross_refs VALUES ('father', 'gregory-the-dialogist-0123456789', 'verse', 'Luke.10.1');
    `);
    const lib = createLibrary(content, () => [wrap(pack)]);
    expect((await lib.fatherAuthors())[0]).toMatchObject({ name: 'Gregory the Great', excerpts: 1 });
    expect((await lib.fathersForVerse('Luke.10.1'))[0]?.author).toBe('Gregory the Great');
    expect((await lib.fatherExcerptsBySlug(['gregory-the-dialogist-0123456789']))[0]?.author).toBe('Gregory the Great');
    expect(await lib.fatherRefs('gregory-the-dialogist', 'Luke')).toEqual([{ slug: 'gregory-the-dialogist-0123456789', ref: 'Luke.10.1' }]);
  });

  it('finds Fathers by any of their names, ignoring accents', () => {
    const list = [
      author('gregory-the-dialogist', 'Gregory the Great', 604, 3208, ['Gregory the Dialogist']),
      author('gregory-of-nyssa', 'Gregory of Nyssa', 395, 221),
      author('vincent-of-l-rins', 'Vincent of Lérins', 445),
    ];
    expect(searchFathers(list, 'greg').map((a) => a.slug)).toEqual(['gregory-the-dialogist', 'gregory-of-nyssa']);
    expect(searchFathers(list, 'dialogist')[0]?.name).toBe('Gregory the Great');
    expect(searchFathers(list, 'lerins')[0]?.slug).toBe('vincent-of-l-rins');
    expect(searchFathers(list, '  ')).toEqual([]);
  });

  it('sorts Fathers into eras and picks the most quoted', () => {
    expect([eraOf(108), eraOf(325), eraOf(326), eraOf(749), eraOf(804), eraOf(null)]).toEqual(['early', 'early', 'patristic', 'patristic', 'medieval', 'medieval']);
    const list = [author('a', 'A', 430, 10), author('b', 'B', 220, 30), author('c', 'C', 150, 20)];
    expect(mostQuoted(list, 2).map((a) => a.slug)).toEqual(['b', 'c']);
    expect(fathersInEra(list, 'early').map((a) => a.slug)).toEqual(['c', 'b']);
    expect(diedLabel(author('x', 'Augustine of Hippo', 430))).toBe('d. 430');
    expect(diedLabel(author('x', 'Glossa Ordinaria', 1274))).toBe('c. 1274');
  });

  it('goes from a Father to his books, chapters and verses in Douay numbering', async () => {
    const refs = await library.fatherRefs('augustine-of-hippo');
    const books = booksOf(refs, await library.books());
    expect(books.map((b) => b.osis).slice(0, 2)).toEqual(['Ps', 'Matt']);
    expect(books.reduce((n, b) => n + b.count, 0)).toBe(refs.length);

    // Psalm 23 in modern Bibles is Psalm 22 in the Douay-Rheims.
    const psalms = refs.filter((r) => r.ref.startsWith('Ps.'));
    const places = await library.douayPlaces('Ps');
    const chapters = chaptersOf(psalms, places);
    const p23 = psalms.filter((r) => r.ref.startsWith('Ps.23.')).length;
    expect(p23).toBeGreaterThan(0);
    expect(chapters.find((c) => c.chapter === 22)?.count).toBe(p23);

    const verses = versesOf(psalms, places, 22);
    expect(verses.reduce((n, v) => n + v.slugs.length, 0)).toBe(p23);
    expect(verses.map((v) => v.verse)).toEqual([...verses.map((v) => v.verse)].sort((a, b) => a - b));
    expect(verses[0]!.ref.startsWith('Ps.23.')).toBe(true);
  });

  it('links a Father to his own saint page, not a saint he wrote about', () => {
    const saints = [
      { name: 'Saint Anthony of Egypt', fathers: ['athanasius-of-alexandria'] },
      { name: 'Saint Athanasius', fathers: ['athanasius-of-alexandria'] },
      { name: 'Saint Gregory the Great', fathers: ['gregory-the-dialogist'] },
      { name: 'Saints Basil the Great and Gregory Nazianzen', fathers: ['basil-of-caesarea', 'gregory-of-nazianzus'] },
    ];
    expect(saintFor({ slug: 'athanasius-of-alexandria', name: 'Athanasius of Alexandria' }, saints)?.name).toBe('Saint Athanasius');
    expect(saintFor({ slug: 'gregory-the-dialogist', name: 'Gregory the Great' }, saints)?.name).toBe('Saint Gregory the Great');
    expect(saintFor({ slug: 'basil-of-caesarea', name: 'Basil the Great' }, saints)?.name).toBe('Saints Basil the Great and Gregory Nazianzen');
    expect(saintFor({ slug: 'origen-of-alexandria', name: 'Origen' }, saints)).toBeNull();
  });

  it('every saint page that lists a Father is found from at least one of them', async () => {
    const { createContentStore } = await import('@/data/contentStore');
    const saints = await createContentStore(content, 'test').saints();
    const authors = await library.fatherAuthors();
    const linked = saints.filter((s) => s.fathers.length);
    const missed = linked.filter((s) => !authors.some((a) => saintFor(a, saints) === s));
    expect(missed.map((s) => s.name)).toEqual(['Saint Anthony of Egypt']);
  });

  it('shades chapters by how much they hold', () => {
    const counts = [3, 10, 6, 152, 4, 30, 8];
    expect(counts.map((n) => shade(n, counts))).toEqual([1, 3, 2, 3, 1, 3, 2]);
    expect(shade(5, [5])).toBe(1);
  });
});
