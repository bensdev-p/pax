import type { MyPrayer, Prayer } from '@/data/types';

import { newId } from './notes';

/**
 * Prayers the user adds to their prayer book (Phase 4, layout chosen with Ben): each is filed
 * under one of the book's sections and shows there beside Pax's own, marked as theirs.
 */
const PREFIX = 'mine-';

/** The prayer book's slug for a user's prayer, so favorites and links work as for any prayer. */
export const mySlug = (id: string) => `${PREFIX}${id}`;
export const isMySlug = (slug: string) => slug.startsWith(PREFIX);
export const myIdOf = (slug: string) => slug.slice(PREFIX.length);

/** The chip in the prayer book that lists only the user's own prayers. */
export const YOURS = 'yours';

/** A user's prayer as a prayer book entry. */
export function asPrayer(p: MyPrayer): Prayer {
  return {
    slug: mySlug(p.id),
    title: p.title,
    latin_title: null,
    category: p.category,
    text: p.text,
    latin_text: p.latinText,
    sort_order: Number.MAX_SAFE_INTEGER,
    by: p.by,
    mine: true,
  };
}

export interface MyPrayerDraft {
  title: string;
  by: string;
  category: string;
  text: string;
  latinText: string;
}

/** Tidies a draft (trims, keeps the lines as typed, drops trailing blank lines); null until it has a title and text. */
export function myPrayerFrom(draft: MyPrayerDraft, existing?: MyPrayer, now = new Date().toISOString()): MyPrayer | null {
  const lines = (s: string) => s.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '');
  const title = draft.title.trim();
  const text = lines(draft.text);
  if (!title || !text) return null;
  return {
    id: existing?.id ?? newId(),
    title,
    by: draft.by.trim() || null,
    category: draft.category,
    text,
    latinText: lines(draft.latinText) || null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
