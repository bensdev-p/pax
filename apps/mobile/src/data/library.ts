import { ftsQuery, queryWords, type ReadDb } from './db';

/**
 * The Library's queries (SPEC: Library). Verse keys are OSIS refs in standard numbering
 * (Ps.23.1); the Douay-Rheims text keeps its own chapter and verse numbers for reading.
 * Fathers come from the downloaded pack when it is installed, otherwise from the starter set
 * bundled in content.db.
 */
export interface BibleBook {
  osis: string;
  name: string;
  name_douay: string;
  testament: 'OT' | 'NT';
  sort_order: number;
  chapter_count: number;
}

export interface ChapterVerse {
  ref: string;
  chapter: number;
  verse: number;
  douay_verse: number;
  text: string;
  links: number;
  notes: number;
}

export interface ChapterView {
  book: BibleBook;
  chapter: number;
  title: string | null;
  incipit: string | null;
  summary: string | null;
  verses: ChapterVerse[];
}

export interface VerseDetail {
  ref: string;
  book: string;
  chapter: number;
  verse: number;
  douay_chapter: number;
  douay_verse: number;
  text: string;
  name: string;
  name_douay: string;
}

export interface BibleNote {
  seq: number;
  keyword: string | null;
  text: string;
}

export interface CccParagraph {
  number: number;
  part: string;
  section: string;
  heading: string;
  summary: string | null;
  vatican_url: string;
}

export interface CccSection {
  part: string;
  section: string;
  heading: string;
  first: number;
  last: number;
}

export interface FatherExcerpt {
  slug: string;
  author: string;
  author_slug: string;
  year: number | null;
  work: string;
  source_url: string | null;
  text: string;
  /** First verse the excerpt comments on. */
  ref?: string;
}

export interface FatherAuthor {
  slug: string;
  name: string;
  year: number | null;
  category: string | null;
  excerpts: number;
}

export type SearchKind = 'verse' | 'ccc' | 'father' | 'prayer';

export interface SearchHit {
  kind: SearchKind;
  key: string;
  title: string;
  snippet: string;
}

export interface LibraryStore {
  books(): Promise<BibleBook[]>;
  book(osis: string): Promise<BibleBook | null>;
  chapter(osis: string, douayChapter: number): Promise<ChapterView | null>;
  verse(ref: string): Promise<VerseDetail | null>;
  notes(ref: string): Promise<BibleNote[]>;
  cccForVerse(ref: string): Promise<CccParagraph[]>;
  fathersForVerse(ref: string): Promise<FatherExcerpt[]>;
  ccc(number: number): Promise<CccParagraph | null>;
  cccVerses(number: number): Promise<VerseDetail[]>;
  cccOutline(): Promise<CccSection[]>;
  fatherAuthors(): Promise<FatherAuthor[]>;
  fatherExcerpts(authorSlug: string, limit?: number): Promise<FatherExcerpt[]>;
  search(query: string, limitPerKind?: number): Promise<SearchHit[]>;
  stats(): Promise<{ verses: number; ccc: number; fathers: number; fullFathers: boolean }>;
  /** Douay chapter that holds a standard-numbered verse (Ps.23.1 → Psalms 22). */
  locate(ref: string): Promise<{ book: string; douay_chapter: number; douay_verse: number } | null>;
}

const VERSE_COLUMNS = `v.ref, v.book, v.chapter, v.verse, v.douay_chapter, v.douay_verse, v.text, b.name, b.name_douay`;

/** Fathers columns; `ref` is the verse the row was reached by, or the excerpt's first verse. */
const fatherSelect = (refExpr: string) => `
  SELECT p.slug, p.text, p.year, p.author_slug, a.name AS author, w.title AS work, w.source_volume AS source_url, ${refExpr} AS ref
  FROM father_passages p
  JOIN father_works w ON w.slug = p.work_slug
  JOIN father_authors a ON a.slug = p.author_slug`;

/** "Psalms 22:1" in Douay numbering. */
export function verseLabel(v: Pick<VerseDetail, 'name_douay' | 'douay_chapter' | 'douay_verse'>): string {
  return `${v.name_douay} ${v.douay_chapter}:${v.douay_verse}`;
}

/** "Psalm 23:1" in standard numbering, or null when it matches the Douay numbering and name. */
export function modernLabel(v: VerseDetail): string | null {
  const name = v.book === 'Ps' ? 'Psalm' : v.name;
  if (v.name === v.name_douay && v.chapter === v.douay_chapter && v.verse === v.douay_verse) return null;
  return `${name} ${v.chapter}:${v.verse}`;
}

export function createLibrary(content: ReadDb, packs: () => ReadDb[] = () => []): LibraryStore {
  const fatherSources = () => {
    const installed = packs();
    return installed.length ? installed : [content];
  };

  return {
    books: () => content.all<BibleBook>('SELECT osis, name, name_douay, testament, sort_order, chapter_count FROM bible_books ORDER BY sort_order'),

    book: (osis) =>
      content.first<BibleBook>('SELECT osis, name, name_douay, testament, sort_order, chapter_count FROM bible_books WHERE osis = ?', [osis]),

    async chapter(osis, douayChapter) {
      const book = await this.book(osis);
      if (!book) return null;
      const meta = await content.first<{ title: string | null; incipit: string | null; summary: string | null }>(
        'SELECT title, incipit, summary FROM bible_chapters WHERE book = ? AND douay_chapter = ?',
        [osis, douayChapter],
      );
      const verses = await content.all<ChapterVerse>(
        `SELECT v.ref, v.chapter, v.verse, v.douay_verse, v.text,
                (SELECT count(*) FROM cross_refs c WHERE c.to_type = 'verse' AND c.to_key = v.ref AND c.from_type IN ('ccc', 'father')) AS links,
                (SELECT count(*) FROM bible_notes n WHERE n.ref = v.ref) AS notes
         FROM bible_verses v WHERE v.book = ? AND v.douay_chapter = ? ORDER BY v.douay_verse`,
        [osis, douayChapter],
      );
      if (!verses.length) return null;
      return { book, chapter: douayChapter, title: meta?.title ?? null, incipit: meta?.incipit ?? null, summary: meta?.summary ?? null, verses };
    },

    verse: (ref) =>
      content.first<VerseDetail>(`SELECT ${VERSE_COLUMNS} FROM bible_verses v JOIN bible_books b ON b.osis = v.book WHERE v.ref = ?`, [ref]),

    notes: (ref) => content.all<BibleNote>('SELECT seq, keyword, text FROM bible_notes WHERE ref = ? ORDER BY seq', [ref]),

    cccForVerse: (ref) =>
      content.all<CccParagraph>(
        `SELECT p.number, p.part, p.section, p.heading, p.summary, p.vatican_url
         FROM cross_refs c JOIN ccc_paragraphs p ON p.number = CAST(c.from_key AS INTEGER)
         WHERE c.from_type = 'ccc' AND c.to_type = 'verse' AND c.to_key = ? ORDER BY p.number`,
        [ref],
      ),

    async fathersForVerse(ref) {
      const results = await Promise.all(
        fatherSources().map((db) =>
          db.all<FatherExcerpt>(
            `${fatherSelect('c.to_key')}
             JOIN cross_refs c ON c.from_type = 'father' AND c.from_key = p.slug
             WHERE c.to_type = 'verse' AND c.to_key = ?`,
            [ref],
          ),
        ),
      );
      const seen = new Set<string>();
      return results
        .flat()
        .filter((f) => (seen.has(f.slug) ? false : (seen.add(f.slug), true)))
        .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    },

    ccc: (number) =>
      content.first<CccParagraph>('SELECT number, part, section, heading, summary, vatican_url FROM ccc_paragraphs WHERE number = ?', [number]),

    cccVerses: (number) =>
      content.all<VerseDetail>(
        `SELECT ${VERSE_COLUMNS} FROM cross_refs c
         JOIN bible_verses v ON v.ref = c.to_key JOIN bible_books b ON b.osis = v.book
         WHERE c.from_type = 'ccc' AND c.from_key = ? AND c.to_type = 'verse'
         ORDER BY b.sort_order, v.chapter, v.verse`,
        [String(number)],
      ),

    cccOutline: () =>
      content.all<CccSection>(
        `SELECT part, section, heading, MIN(number) AS first, MAX(number) AS last
         FROM ccc_paragraphs GROUP BY part, section, heading ORDER BY first`,
      ),

    async fatherAuthors() {
      const lists = await Promise.all(
        fatherSources().map((db) =>
          db.all<FatherAuthor>(
            `SELECT a.slug, a.name, a.year, a.category, count(p.slug) AS excerpts
             FROM father_authors a JOIN father_passages p ON p.author_slug = a.slug GROUP BY a.slug`,
          ),
        ),
      );
      const merged = new Map<string, FatherAuthor>();
      for (const a of lists.flat()) {
        const prev = merged.get(a.slug);
        merged.set(a.slug, prev ? { ...prev, excerpts: prev.excerpts + a.excerpts } : a);
      }
      return [...merged.values()].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    },

    async fatherExcerpts(authorSlug, limit = 100) {
      const order = new Map((await this.books()).map((b) => [b.osis, b.sort_order]));
      const lists = await Promise.all(
        fatherSources().map((db) =>
          db.all<FatherExcerpt>(
            `${fatherSelect('r.ref')}
             JOIN (SELECT from_key, MIN(to_key) AS ref FROM cross_refs WHERE from_type = 'father' GROUP BY from_key) r
               ON r.from_key = p.slug
             WHERE p.author_slug = ?`,
            [authorSlug],
          ),
        ),
      );
      const key = (ref = '') => {
        const [book, ch, v] = ref.split('.');
        return (order.get(book ?? '') ?? 999) * 1e6 + Number(ch) * 1e3 + Number(v);
      };
      return lists
        .flat()
        .sort((a, b) => key(a.ref) - key(b.ref))
        .slice(0, limit);
    },

    async search(query, limitPerKind = 12) {
      const hits: SearchHit[] = [];
      const fts = ftsQuery(query);
      if (!fts) return hits;
      if (content.hasFts) {
        const docs = await content.all<{ kind: SearchKind; key: string; title: string }>(
          `SELECT d.kind, d.key, d.title FROM search_index
           JOIN search_docs d ON d.rowid = search_index.rowid
           WHERE search_index MATCH ? ORDER BY rank LIMIT 200`,
          [fts],
        );
        const counts: Record<string, number> = {};
        for (const d of docs) {
          counts[d.kind] = (counts[d.kind] ?? 0) + 1;
          if (counts[d.kind]! > limitPerKind) continue;
          hits.push({ ...d, snippet: await snippetFor(content, d.kind, d.key) });
        }
      } else {
        hits.push(...(await likeSearch(content, query, limitPerKind)));
      }
      // Fathers in the downloaded pack (searched without FTS: the pack is plain tables).
      const installed = packs();
      if (installed.length) {
        const words = queryWords(query);
        if (words.length) {
          const where = words.map(() => 'p.text LIKE ?').join(' AND ');
          const params = words.map((w) => `%${w}%`);
          const fromPacks = (
            await Promise.all(
              installed.map((db) =>
                db.all<{ slug: string; author: string; text: string }>(
                  `SELECT p.slug, a.name AS author, p.text FROM father_passages p JOIN father_authors a ON a.slug = p.author_slug WHERE ${where} LIMIT ?`,
                  [...params, limitPerKind],
                ),
              ),
            )
          ).flat();
          const others = hits.filter((h) => h.kind !== 'father');
          hits.length = 0;
          hits.push(
            ...others,
            ...fromPacks.slice(0, limitPerKind).map((f) => ({ kind: 'father' as const, key: f.slug, title: f.author, snippet: clip(f.text, words[0]) })),
          );
        }
      }
      return hits;
    },

    async stats() {
      const verses = (await content.first<{ n: number }>('SELECT count(*) AS n FROM bible_verses'))?.n ?? 0;
      const ccc = (await content.first<{ n: number }>('SELECT count(*) AS n FROM ccc_paragraphs'))?.n ?? 0;
      const sources = fatherSources();
      let fathers = 0;
      for (const db of sources) fathers += (await db.first<{ n: number }>('SELECT count(*) AS n FROM father_passages'))?.n ?? 0;
      return { verses, ccc, fathers, fullFathers: packs().length > 0 };
    },

    locate: (ref) =>
      content.first<{ book: string; douay_chapter: number; douay_verse: number }>(
        'SELECT book, douay_chapter, douay_verse FROM bible_verses WHERE ref = ?',
        [ref],
      ),
  };
}

async function snippetFor(db: ReadDb, kind: SearchKind, key: string): Promise<string> {
  const row =
    kind === 'verse'
      ? await db.first<{ t: string }>('SELECT text AS t FROM bible_verses WHERE ref = ?', [key])
      : kind === 'father'
        ? await db.first<{ t: string }>('SELECT text AS t FROM father_passages WHERE slug = ?', [key])
        : kind === 'ccc'
          ? await db.first<{ t: string }>("SELECT section || ' · ' || heading AS t FROM ccc_paragraphs WHERE number = ?", [Number(key)])
          : await db.first<{ t: string }>('SELECT text AS t FROM prayers WHERE slug = ?', [key]);
  return clip(row?.t ?? '');
}

async function likeSearch(db: ReadDb, query: string, limit: number): Promise<SearchHit[]> {
  const words = queryWords(query);
  if (!words.length) return [];
  const like = (col: string) => words.map(() => `${col} LIKE ?`).join(' AND ');
  const params = words.map((w) => `%${w}%`);
  const verses = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT v.ref AS key, b.name_douay || ' ' || v.douay_chapter || ':' || v.douay_verse AS title, v.text AS snippet
     FROM bible_verses v JOIN bible_books b ON b.osis = v.book WHERE ${like('v.text')} ORDER BY b.sort_order, v.douay_chapter, v.douay_verse LIMIT ?`,
    [...params, limit],
  );
  const ccc = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT CAST(number AS TEXT) AS key, 'CCC ' || number AS title, section || ' · ' || heading AS snippet
     FROM ccc_paragraphs WHERE ${like("(section || ' ' || heading)")} LIMIT ?`,
    [...params, limit],
  );
  const fathers = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT p.slug AS key, a.name AS title, p.text AS snippet FROM father_passages p JOIN father_authors a ON a.slug = p.author_slug
     WHERE ${like('p.text')} LIMIT ?`,
    [...params, limit],
  );
  const prayers = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT slug AS key, title, text AS snippet FROM prayers WHERE ${like("(title || ' ' || text)")} LIMIT ?`,
    [...params, limit],
  );
  return [
    ...verses.map((h) => ({ ...h, kind: 'verse' as const, snippet: clip(h.snippet, words[0]) })),
    ...ccc.map((h) => ({ ...h, kind: 'ccc' as const })),
    ...fathers.map((h) => ({ ...h, kind: 'father' as const, snippet: clip(h.snippet, words[0]) })),
    ...prayers.map((h) => ({ ...h, kind: 'prayer' as const, snippet: clip(h.snippet, words[0]) })),
  ];
}

/** Up to ~160 characters around the first match. */
export function clip(text: string, word?: string, size = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= size) return flat;
  const at = word ? flat.toLowerCase().indexOf(word.toLowerCase()) : -1;
  const start = at > 40 ? at - 40 : 0;
  const piece = flat.slice(start, start + size).trim();
  return `${start > 0 ? '…' : ''}${piece}…`;
}
