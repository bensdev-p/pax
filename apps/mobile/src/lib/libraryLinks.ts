import { citationStart, parseCitation } from '@pax/liturgy';
import { router } from 'expo-router';

import type { LibraryStore } from '@/data/library';

/** Opens the Douay-Rheims reader at a lectionary citation, highlighting the verses cited. */
export async function openCitation(library: LibraryStore, citation: string): Promise<boolean> {
  const start = citationStart(citation);
  if (!start) return false;
  const at = await library.locate(start);
  if (!at) return false;
  router.push({
    pathname: '/bible/[book]/[chapter]',
    params: { book: at.book, chapter: String(at.douay_chapter), verse: start, hl: citation },
  });
  return true;
}

export function openVerse(ref: string) {
  router.push({ pathname: '/verse/[ref]', params: { ref } });
}

export function openChapter(book: string, chapter: number, verse?: string) {
  router.push({ pathname: '/bible/[book]/[chapter]', params: { book, chapter: String(chapter), ...(verse ? { verse } : {}) } });
}

/** Every standard-numbered verse a citation covers, for chips and highlights. */
export function citationRefs(citation: string): string[] {
  const out: string[] = [];
  for (const r of parseCitation(citation)) {
    if (r.chapter !== r.endChapter) {
      out.push(`${r.book}.${r.chapter}.${r.verse}`);
      continue;
    }
    for (let v = r.verse; v <= Math.min(r.endVerse, r.verse + 40); v++) out.push(`${r.book}.${r.chapter}.${v}`);
  }
  return out;
}
