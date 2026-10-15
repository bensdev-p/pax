import type { MysterySet } from '@pax/liturgy';

import type { Devotion, Note, NovenaProgress, Prayer } from '@/data/types';

import { NOVENA_DAYS } from './devotions';
import { YOURS } from './myPrayers';

/**
 * The Pray tab as a hub (decided with Ben, Phase 3): today's Rosary, "For you" (what you're in
 * the middle of, the season's picks and your favorites), then a shelf of ways to pray, each one
 * tap from its own short page.
 */

/** The prayer book's sections, in order. */
export const PRAYER_SECTIONS: { category: string; title: string }[] = [
  { category: 'essentials', title: 'Essentials' },
  { category: 'daily', title: 'Through the day' },
  { category: 'marian', title: 'Mary' },
  { category: 'eucharist', title: 'Eucharist' },
  { category: 'saints', title: 'Saints' },
  { category: 'departed', title: 'Departed' },
  { category: 'rosary', title: 'Rosary' },
];

export type DevotionKind = Devotion['kind'];

/** The kinds of devotion with a page of their own, and how that page introduces them. */
export const DEVOTION_KINDS: Record<DevotionKind, { title: string; intro: string }> = {
  chaplet: { title: 'Chaplets', intro: 'Prayed on the beads, one short prayer at a time.' },
  stations: { title: 'Stations of the Cross', intro: 'Walk with Jesus from Pilate’s court to the tomb.' },
  litany: { title: 'Litanies', intro: 'Call on the Lord and his saints, one invocation at a time.' },
  novena: { title: 'Novenas', intro: 'Nine days of prayer, often before a feast. Pax keeps your place.' },
};

export const isDevotionKind = (k: unknown): k is DevotionKind => typeof k === 'string' && Object.hasOwn(DEVOTION_KINDS, k);

/** When each set of mysteries is prayed (Rosarium Virginis Mariae 38). */
export const ROSARY_DAYS: Record<MysterySet, string> = {
  joyful: 'Mondays and Saturdays, and Sundays of Advent and Christmas',
  luminous: 'Thursdays',
  sorrowful: 'Tuesdays and Fridays, and Sundays of Lent',
  glorious: 'Wednesdays and the other Sundays',
};

export const ROSARY_ORDER: MysterySet[] = ['joyful', 'luminous', 'sorrowful', 'glorious'];

export const isMysterySet = (s: unknown): s is MysterySet => typeof s === 'string' && (ROSARY_ORDER as string[]).includes(s);

/** One card in the "For you" row. */
export interface ForYouItem {
  key: string;
  kind: 'novena' | 'season' | 'favorite';
  label: string;
  title: string;
  /** Novenas in progress: share of the nine days prayed. */
  progress?: number;
  target: { type: 'devotion' | 'prayer'; slug: string };
}

/**
 * Novenas in progress first (with today's day), then the season's devotions not already
 * there, then favorites not already shown.
 */
export function forYou(input: {
  date: string;
  novenas: NovenaProgress[];
  featured: Devotion[];
  favorites: Note[];
}): ForYouItem[] {
  const items: ForYouItem[] = [];
  const seen = new Set<string>();
  for (const n of input.novenas.filter((x) => x.daysDone < NOVENA_DAYS)) {
    const prayed = n.lastPrayedOn === input.date;
    items.push({
      key: `novena:${n.slug}`,
      kind: 'novena',
      label: prayed ? `Day ${n.daysDone} prayed` : `Novena · Day ${n.daysDone + 1}`,
      title: n.title,
      progress: n.daysDone / NOVENA_DAYS,
      target: { type: 'devotion', slug: n.slug },
    });
    seen.add(n.slug);
  }
  for (const d of input.featured) {
    if (seen.has(d.slug)) continue;
    items.push({ key: `season:${d.slug}`, kind: 'season', label: 'For this season', title: d.title, target: { type: 'devotion', slug: d.slug } });
    seen.add(d.slug);
  }
  for (const f of input.favorites) {
    if (seen.has(f.targetKey)) continue;
    items.push({
      key: `favorite:${f.id}`,
      kind: 'favorite',
      label: '★ Favorite',
      title: f.prompt ?? f.targetKey,
      target: { type: f.targetType === 'devotion' ? 'devotion' : 'prayer', slug: f.targetKey },
    });
    seen.add(f.targetKey);
  }
  return items;
}

/** Prayers in a section (or the user's own), or matching a search (title, author or text, any section). */
export function filterPrayers(prayers: Prayer[], query: string, category: string): Prayer[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  // The "Yours" chip lists the user's own prayers, whatever section they're filed under.
  if (!words.length) return prayers.filter((p) => (category === YOURS ? p.mine : p.category === category));
  const hits = prayers.filter((p) => {
    const hay = `${p.title} ${p.by ?? ''} ${p.text}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  // Prayers named for the search come before ones that only mention it.
  const inTitle = (p: Prayer) => (words.some((w) => p.title.toLowerCase().includes(w)) ? 0 : 1);
  return hits.sort((a, b) => inTitle(a) - inTitle(b));
}

/** The tinted label on a devotion in its list: a novena's next day, or why it's featured now. */
export function devotionLabel(d: Devotion, going: NovenaProgress[], featured: Devotion[]): string | undefined {
  const n = going.find((x) => x.slug === d.slug);
  if (n) return `In progress · Day ${n.daysDone + 1} of ${NOVENA_DAYS}`;
  if (!featured.some((f) => f.slug === d.slug)) return undefined;
  return d.kind === 'novena' ? 'Its nine days are now' : 'For this season';
}

/** In progress first, then the ones featured now, then the rest in their usual order. */
export function sortDevotions(list: Devotion[], going: NovenaProgress[], featured: Devotion[]): Devotion[] {
  const rank = (d: Devotion) => (going.some((n) => n.slug === d.slug) ? 0 : featured.some((f) => f.slug === d.slug) ? 1 : 2);
  return [...list].sort((a, b) => rank(a) - rank(b) || a.sort_order - b.sort_order);
}
