import type { BibleBook, DouayPlace, FatherAuthor, FatherRef } from '@/data/library';

/**
 * The Church Fathers as a directory (decided with Ben, Phase 3): search, the most-quoted
 * Fathers, then one era at a time. A Father's page goes book → chapter → verse, so even
 * Augustine's 6,800 excerpts arrive a screenful at a time.
 */

export type EraKey = 'early' | 'patristic' | 'medieval';

/** The three eras, each with a color for its Fathers' quill. */
export const FATHER_ERAS: { key: EraKey; label: string; span: string; until: number; tint: string }[] = [
  { key: 'early', label: 'Before Nicaea', span: 'to 325', until: 325, tint: '#E5484D' },
  { key: 'patristic', label: '325–750', span: 'Nicaea to John of Damascus', until: 750, tint: '#F5A524' },
  { key: 'medieval', label: 'Medieval', span: '750–1300', until: Infinity, tint: '#2FA4E7' },
];

export function eraOf(year: number | null): EraKey {
  const y = year ?? Infinity;
  return (FATHER_ERAS.find((e) => y <= e.until) ?? FATHER_ERAS[FATHER_ERAS.length - 1]!).key;
}

export const eraTint = (year: number | null) => FATHER_ERAS.find((e) => e.key === eraOf(year))!.tint;

/** "d. 430"; the source dates a few anonymous works by their collection, so those say "c.". */
export function diedLabel(a: Pick<FatherAuthor, 'year' | 'name'>): string | null {
  if (!a.year || a.year >= 9999) return null;
  return /^(The |Glossa|Ancient)/.test(a.name) ? `c. ${a.year}` : `d. ${a.year}`;
}

/** Fathers whose name or other names hold every word typed, most-quoted first. */
export function searchFathers(authors: FatherAuthor[], query: string): FatherAuthor[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return authors
    .filter((a) => {
      const hay = fold([a.name, ...a.also].join(' '));
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => b.excerpts - a.excerpts);
}

/** The Fathers with the most excerpts in what's installed. */
export const mostQuoted = (authors: FatherAuthor[], n = 4) => [...authors].sort((a, b) => b.excerpts - a.excerpts).slice(0, n);

export const fathersInEra = (authors: FatherAuthor[], era: EraKey) =>
  authors.filter((a) => eraOf(a.year) === era).sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));

export interface BookCount {
  osis: string;
  name: string;
  testament: 'OT' | 'NT';
  count: number;
}

const bookOf = (ref: string) => ref.slice(0, ref.indexOf('.'));

/** The books a Father comments on, in Bible order, with how many excerpts each. */
export function booksOf(refs: FatherRef[], books: BibleBook[]): BookCount[] {
  const counts = new Map<string, number>();
  for (const r of refs) counts.set(bookOf(r.ref), (counts.get(bookOf(r.ref)) ?? 0) + 1);
  return books.filter((b) => counts.has(b.osis)).map((b) => ({ osis: b.osis, name: b.name_douay, testament: b.testament, count: counts.get(b.osis)! }));
}

/** Each excerpt's place in the Douay-Rheims; excerpts on a verse the Douay text lacks are left out. */
function placed(refs: FatherRef[], places: DouayPlace[]) {
  const at = new Map(places.map((p) => [p.ref, p]));
  return refs.flatMap((r) => {
    const p = at.get(r.ref);
    return p ? [{ ...r, chapter: p.douay_chapter, verse: p.douay_verse }] : [];
  });
}

/** Chapters (Douay numbering, as the reader shows them) with how many excerpts each. */
export function chaptersOf(refs: FatherRef[], places: DouayPlace[]): { chapter: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const r of placed(refs, places)) counts.set(r.chapter, (counts.get(r.chapter) ?? 0) + 1);
  return [...counts].map(([chapter, count]) => ({ chapter, count })).sort((a, b) => a.chapter - b.chapter);
}

/**
 * 1–3: where a chapter ranks among the book's chapters by excerpts (top third darkest). By rank,
 * not share of the busiest, so one huge chapter (Psalm 118) doesn't wash out the rest.
 */
export function shade(count: number, all: number[]): 1 | 2 | 3 {
  if (all.length < 2) return 1;
  const below = all.filter((n) => n < count).length / (all.length - 1);
  return below >= 2 / 3 ? 3 : below >= 1 / 3 ? 2 : 1;
}

/** One chapter's excerpts grouped by verse (Douay numbering), in order. */
export function versesOf(refs: FatherRef[], places: DouayPlace[], chapter: number): { verse: number; ref: string; slugs: string[] }[] {
  const groups = new Map<number, { verse: number; ref: string; slugs: string[] }>();
  for (const r of placed(refs, places)) {
    if (r.chapter !== chapter) continue;
    const g = groups.get(r.verse) ?? { verse: r.verse, ref: r.ref, slugs: [] };
    g.slugs.push(r.slug);
    groups.set(r.verse, g);
  }
  return [...groups.values()].sort((a, b) => a.verse - b.verse);
}

/** Lowercase without accents, so "lerins" finds Vincent of Lérins. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const NAME_FILLER = new Set(['pope', 'saint', 'saints', 'the', 'of', 'and', 'great', 'passion', 'martyrdom']);

/**
 * The saint's page that is about this Father, if Pax has one. A saint lists the Fathers who
 * wrote about them too (Athanasius on Anthony of Egypt), so the saint must also share a name.
 */
export function saintFor<S extends { name: string; fathers: string[] }>(author: Pick<FatherAuthor, 'slug' | 'name'>, saints: S[]): S | null {
  const words = fold(author.name)
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !NAME_FILLER.has(w));
  return saints.find((s) => s.fathers.includes(author.slug) && words.some((w) => fold(s.name).split(/[^a-z]+/).includes(w))) ?? null;
}
