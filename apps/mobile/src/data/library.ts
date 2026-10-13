import { parseCitation } from '@pax/liturgy';

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
  /** Catechism paragraphs citing the verse (the Fathers cover nearly every verse, so aren't counted). */
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
  /** The familiar name (seed/fathers.json), e.g. Gregory the Great. */
  name: string;
  /** Other names: the source's own, a Latin or Greek form, a title. */
  also: string[];
  year: number | null;
  category: string | null;
  excerpts: number;
}

/** An excerpt and the first verse it comments on (standard numbering). */
export interface FatherRef {
  slug: string;
  ref: string;
}

/** Where a standard-numbered verse sits in the Douay-Rheims. */
export interface DouayPlace {
  ref: string;
  douay_chapter: number;
  douay_verse: number;
}

export type SearchKind = 'verse' | 'ccc' | 'father' | 'prayer' | 'saint' | 'devotion' | 'course';

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
  fatherAuthor(slug: string): Promise<FatherAuthor | null>;
  /** Each of a Father's excerpts with its first verse, optionally in one book. */
  fatherRefs(authorSlug: string, book?: string): Promise<FatherRef[]>;
  /** Excerpts by slug, in the order given. */
  fatherExcerptsBySlug(slugs: string[]): Promise<FatherExcerpt[]>;
  /** Douay chapter and verse of every verse in a book, by standard ref. */
  douayPlaces(book: string): Promise<DouayPlace[]>;
  /** One excerpt by slug, from the starter set or the downloaded library. */
  fatherPassage(slug: string): Promise<FatherExcerpt | null>;
  search(query: string, limitPerKind?: number): Promise<SearchHit[]>;
  stats(): Promise<{ verses: number; ccc: number; fathers: number; fullFathers: boolean }>;
  /**
   * The Douay-Rheims text of a lectionary citation ("Isaiah 63:16b–17, 19b; 64:2–7"), one
   * segment per verse range so the reader can mark the gaps. Empty when nothing matches.
   */
  passage(citation: string): Promise<VerseDetail[][]>;
  /** Douay chapter that holds a standard-numbered verse (Ps.23.1 → Psalms 22). */
  locate(ref: string): Promise<{ book: string; douay_chapter: number; douay_verse: number } | null>;
  /**
   * New Testament verse keys as they were before the Douay's own verse divisions were mapped
   * (Phase 3), and what they are now: "John.6.69" → "John.6.68". For moving the user's notes.
   */
  verseRenames(): Promise<Record<string, string>>;
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

/**
 * Where a modern verse number and a Douay verse differ (pipeline/verse_map.py): a modern verse
 * with no Douay verse of its own is an alias for the one that holds it (Mark.4.41 → Mark.4.40),
 * and the second half of a split verse is keyed "John.6.51!b".
 */
export const baseRef = (ref: string) => ref.replace(/!b$/, '');

export function createLibrary(content: ReadDb, packs: () => ReadDb[] = () => []): LibraryStore {
  /** The verse's own key, the whole verse it is half of, and the modern verses it holds. */
  const keysFor = async (ref: string): Promise<string[]> => {
    const aliases = await content.all<{ ref: string }>('SELECT ref FROM verse_aliases WHERE verse_ref = ?', [ref]);
    return [...new Set([ref, baseRef(ref), ...aliases.map((a) => a.ref)])];
  };
  const holder = async (ref: string) =>
    (await content.first<{ verse_ref: string }>('SELECT verse_ref FROM verse_aliases WHERE ref = ?', [ref]))?.verse_ref ?? null;
  const marks = (n: number) => Array.from({ length: n }, () => '?').join(', ');

  const fatherSources = () => {
    const installed = packs();
    return installed.length ? installed : [content];
  };
  // Names come from content.db, which lists every Father by the familiar name; the downloaded
  // library keeps the source's names, so its rows are renamed on the way out.
  let names: Promise<Map<string, { name: string; also: string[]; year: number | null }>> | null = null;
  const fatherNames = () =>
    (names ??= content
      .all<{ slug: string; name: string; also: string | null; year: number | null }>('SELECT slug, name, also, year FROM father_authors')
      .then((rows) => new Map(rows.map((r) => [r.slug, { name: r.name, also: parseAlso(r.also), year: r.year }])))
      .catch(() => new Map()));
  const renamed = async <T extends { author_slug: string; author: string; year?: number | null }>(rows: T[]): Promise<T[]> => {
    const map = await fatherNames();
    return rows.map((r) => {
      const known = map.get(r.author_slug);
      return known ? { ...r, author: known.name, ...('year' in r ? { year: known.year } : {}) } : r;
    });
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
                (SELECT count(*) FROM cross_refs c WHERE c.to_type = 'verse' AND c.to_key = v.ref AND c.from_type = 'ccc') AS links,
                (SELECT count(*) FROM bible_notes n WHERE n.ref = v.ref) AS notes
         FROM bible_verses v WHERE v.book = ? AND v.douay_chapter = ? ORDER BY v.douay_verse`,
        [osis, douayChapter],
      );
      if (!verses.length) return null;
      return { book, chapter: douayChapter, title: meta?.title ?? null, incipit: meta?.incipit ?? null, summary: meta?.summary ?? null, verses };
    },

    async verse(ref) {
      const sql = `SELECT ${VERSE_COLUMNS} FROM bible_verses v JOIN bible_books b ON b.osis = v.book WHERE v.ref = ?`;
      const row = await content.first<VerseDetail>(sql, [ref]);
      if (row) return row;
      const held = await holder(ref);
      return held ? content.first<VerseDetail>(sql, [held]) : null;
    },

    notes: (ref) => content.all<BibleNote>('SELECT seq, keyword, text FROM bible_notes WHERE ref = ? ORDER BY seq', [ref]),

    async cccForVerse(ref) {
      const keys = await keysFor(ref);
      return content.all<CccParagraph>(
        `SELECT DISTINCT p.number, p.part, p.section, p.heading, p.summary, p.vatican_url
         FROM cross_refs c JOIN ccc_paragraphs p ON p.number = CAST(c.from_key AS INTEGER)
         WHERE c.from_type = 'ccc' AND c.to_type = 'verse' AND c.to_key IN (${marks(keys.length)}) ORDER BY p.number`,
        keys,
      );
    },

    async fathersForVerse(ref) {
      // The downloaded library keeps modern numbers, so a Douay verse also gathers the modern
      // verses it holds (Mark 4:40 has Fathers on 4:41) and a half verse its whole one.
      const keys = await keysFor(ref);
      const results = await Promise.all(
        fatherSources().map((db) =>
          db.all<FatherExcerpt>(
            `${fatherSelect('c.to_key')}
             JOIN cross_refs c ON c.from_type = 'father' AND c.from_key = p.slug
             WHERE c.to_type = 'verse' AND c.to_key IN (${marks(keys.length)})`,
            keys,
          ),
        ),
      );
      const seen = new Set<string>();
      return renamed(
        results
          .flat()
          .filter((f) => (seen.has(f.slug) ? false : (seen.add(f.slug), true)))
          .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999)),
      );
    },

    ccc: (number) =>
      content.first<CccParagraph>('SELECT number, part, section, heading, summary, vatican_url FROM ccc_paragraphs WHERE number = ?', [number]),

    cccVerses: (number) =>
      content.all<VerseDetail>(
        `SELECT ${VERSE_COLUMNS} FROM cross_refs c
         JOIN bible_verses v ON v.ref = c.to_key JOIN bible_books b ON b.osis = v.book
         WHERE c.from_type = 'ccc' AND c.from_key = ? AND c.to_type = 'verse'
         ORDER BY b.sort_order, v.chapter, v.verse, v.douay_chapter, v.douay_verse`,
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
      const map = await fatherNames();
      const merged = new Map<string, FatherAuthor>();
      for (const a of lists.flat()) {
        const prev = merged.get(a.slug);
        const known = map.get(a.slug);
        merged.set(
          a.slug,
          prev ? { ...prev, excerpts: prev.excerpts + a.excerpts } : { ...a, name: known?.name ?? a.name, also: known?.also ?? [], year: known ? known.year : a.year },
        );
      }
      return [...merged.values()].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    },

    async fatherAuthor(slug) {
      return (await this.fatherAuthors()).find((a) => a.slug === slug) ?? null;
    },

    async fatherRefs(authorSlug, book) {
      const lists = await Promise.all(
        fatherSources().map((db) =>
          db.all<FatherRef>(
            `SELECT p.slug, MIN(c.to_key) AS ref FROM father_passages p
             JOIN cross_refs c ON c.from_type = 'father' AND c.from_key = p.slug AND c.to_type = 'verse'
             WHERE p.author_slug = ? GROUP BY p.slug`,
            [authorSlug],
          ),
        ),
      );
      const all = lists.flat();
      return book ? all.filter((r) => r.ref.startsWith(`${book}.`)) : all;
    },

    async fatherExcerptsBySlug(slugs) {
      if (!slugs.length) return [];
      const lists = await Promise.all(
        fatherSources().map((db) => db.all<FatherExcerpt>(`${fatherSelect('NULL')} WHERE p.slug IN (${marks(slugs.length)})`, slugs)),
      );
      const bySlug = new Map((await renamed(lists.flat())).map((e) => [e.slug, e]));
      return slugs.map((s) => bySlug.get(s)).filter((e): e is FatherExcerpt => !!e);
    },

    douayPlaces: (book) =>
      content.all<DouayPlace>(
        `SELECT ref, douay_chapter, douay_verse FROM bible_verses WHERE book = ?
         UNION ALL
         SELECT a.ref, v.douay_chapter, v.douay_verse FROM verse_aliases a JOIN bible_verses v ON v.ref = a.verse_ref WHERE v.book = ?`,
        [book, book],
      ),

    async fatherPassage(slug) {
      for (const db of fatherSources()) {
        const row = await db.first<FatherExcerpt>(`${fatherSelect('NULL')} WHERE p.slug = ?`, [slug]);
        if (row) return (await renamed([row]))[0]!;
      }
      return null;
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
                db.all<{ slug: string; author: string; author_slug: string; text: string }>(
                  `SELECT p.slug, a.name AS author, p.author_slug, p.text FROM father_passages p JOIN father_authors a ON a.slug = p.author_slug WHERE ${where} LIMIT ?`,
                  [...params, limitPerKind],
                ),
              ),
            )
          ).flat();
          const named = await renamed(fromPacks);
          const others = hits.filter((h) => h.kind !== 'father');
          hits.length = 0;
          hits.push(
            ...others,
            ...named.slice(0, limitPerKind).map((f) => ({ kind: 'father' as const, key: f.slug, title: f.author, snippet: clip(f.text, words[0]) })),
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

    async passage(citation) {
      const segments: VerseDetail[][] = [];
      for (const r of parseCitation(citation)) {
        const verses = await content.all<VerseDetail>(
          `SELECT ${VERSE_COLUMNS} FROM bible_verses v JOIN bible_books b ON b.osis = v.book
           WHERE v.book = ? AND (v.chapter > ? OR (v.chapter = ? AND v.verse >= ?))
             AND (v.chapter < ? OR (v.chapter = ? AND v.verse <= ?))
           ORDER BY v.chapter, v.verse, v.douay_chapter, v.douay_verse`,
          [r.book, r.chapter, r.chapter, r.verse, r.endChapter, r.endChapter, r.endVerse],
        );
        if (verses.length) segments.push(verses);
      }
      return segments;
    },

    async locate(ref) {
      const sql = 'SELECT book, douay_chapter, douay_verse FROM bible_verses WHERE ref = ?';
      const row = await content.first<{ book: string; douay_chapter: number; douay_verse: number }>(sql, [ref]);
      if (row) return row;
      const held = await holder(ref);
      return held ? content.first<{ book: string; douay_chapter: number; douay_verse: number }>(sql, [held]) : null;
    },

    async verseRenames() {
      const rows = await content.all<{ old: string; ref: string }>(
        `SELECT v.book || '.' || v.douay_chapter || '.' || v.douay_verse AS old, v.ref
         FROM bible_verses v JOIN bible_books b ON b.osis = v.book
         WHERE b.testament = 'NT' AND v.ref <> v.book || '.' || v.douay_chapter || '.' || v.douay_verse`,
      );
      return Object.fromEntries(rows.map((r) => [r.old, r.ref]));
    },
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
          : kind === 'saint'
            ? await db.first<{ t: string }>('SELECT summary AS t FROM saints WHERE romcal_key = ?', [key])
            : kind === 'devotion'
              ? await db.first<{ t: string }>('SELECT summary AS t FROM devotions WHERE slug = ?', [key])
              : kind === 'course'
                ? await db.first<{ t: string }>('SELECT summary AS t FROM courses WHERE slug = ?', [key])
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
  const saints = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT romcal_key AS key, name AS title, coalesce(summary, '') AS snippet FROM saints
     WHERE ${like("(name || ' ' || coalesce(patronage, '') || ' ' || coalesce(bio, ''))")} LIMIT ?`,
    [...params, limit],
  );
  const devotions = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT slug AS key, title, summary AS snippet FROM devotions WHERE ${like("(title || ' ' || summary || ' ' || intro)")} LIMIT ?`,
    [...params, limit],
  );
  const courses = await db.all<{ key: string; title: string; snippet: string }>(
    `SELECT slug AS key, title, summary AS snippet FROM courses WHERE ${like("(title || ' ' || summary || ' ' || intro)")} LIMIT ?`,
    [...params, limit],
  );
  return [
    ...courses.map((h) => ({ ...h, kind: 'course' as const })),
    ...saints.map((h) => ({ ...h, kind: 'saint' as const })),
    ...devotions.map((h) => ({ ...h, kind: 'devotion' as const })),
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

function parseAlso(json: string | null): string[] {
  try {
    const list: unknown = JSON.parse(json ?? '[]');
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
