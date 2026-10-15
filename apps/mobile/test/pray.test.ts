import { describe, expect, it } from 'vitest';

import type { Devotion, NovenaProgress, Prayer } from '@/data/types';
import { asPrayer, isMySlug, myPrayerFrom, YOURS } from '@/lib/myPrayers';
import { makeNote } from '@/lib/notes';
import { devotionLabel, filterPrayers, forYou, isDevotionKind, isMysterySet, sortDevotions } from '@/lib/pray';

const devotion = (slug: string, kind: Devotion['kind'], sort_order = 0): Devotion => ({
  slug,
  title: slug,
  kind,
  summary: '',
  intro: '',
  season: null,
  minutes: null,
  anchor: null,
  steps: [],
  days: null,
  sort_order,
});
const novena = (slug: string, daysDone: number, lastPrayedOn: string | null = null): NovenaProgress => ({
  slug,
  title: slug,
  startedOn: '2026-10-01',
  daysDone,
  lastPrayedOn,
  reminderTime: null,
});
const prayer = (slug: string, category: string, text = ''): Prayer => ({ slug, title: slug, latin_title: null, category, text, latin_text: null, sort_order: 0 });

describe('Pray hub', () => {
  it('puts novenas in progress first, then the season, then favorites, without repeats', () => {
    const items = forYou({
      date: '2026-10-13',
      novenas: [novena('sacred-heart', 3), novena('done', 9), novena('st-joseph', 4, '2026-10-13')],
      featured: [devotion('sacred-heart', 'novena'), devotion('stations', 'stations')],
      favorites: [
        makeNote({ kind: 'favorite', targetType: 'prayer', targetKey: 'memorare', prompt: 'The Memorare' }),
        makeNote({ kind: 'favorite', targetType: 'devotion', targetKey: 'stations', prompt: 'Stations' }),
      ],
    });
    expect(items.map((i) => i.key.split(':')[0])).toEqual(['novena', 'novena', 'season', 'favorite']);
    expect(items[0]).toMatchObject({ label: 'Novena · Day 4', progress: 3 / 9 });
    expect(items[1]!.label).toBe('Day 4 prayed');
    expect(items[3]).toMatchObject({ title: 'The Memorare', target: { type: 'prayer', slug: 'memorare' } });
  });

  it('shows one section, or searches every section by title and text', () => {
    const list = [prayer('our-father', 'essentials', 'Our Father who art in heaven'), prayer('angelus', 'daily', 'The Angel of the Lord declared unto Mary')];
    expect(filterPrayers(list, '', 'daily').map((p) => p.slug)).toEqual(['angelus']);
    expect(filterPrayers(list, 'HEAVEN', 'daily').map((p) => p.slug)).toEqual(['our-father']);
    expect(filterPrayers(list, 'lord mary', 'essentials').map((p) => p.slug)).toEqual(['angelus']);
    expect(filterPrayers(list, 'lord heaven', 'essentials')).toEqual([]);
    const marian = [prayer('creed', 'essentials', 'born of the Virgin Mary'), prayer('hail-mary', 'essentials', 'full of grace')];
    expect(filterPrayers(marian, 'mary', '').map((p) => p.slug)).toEqual(['hail-mary', 'creed']);
  });

  it('labels and orders devotions: in progress, then featured, then the rest', () => {
    const list = [devotion('a', 'novena', 1), devotion('b', 'novena', 2), devotion('c', 'novena', 3)];
    const going = [novena('c', 2)];
    const featured = [devotion('b', 'novena')];
    expect(sortDevotions(list, going, featured).map((d) => d.slug)).toEqual(['c', 'b', 'a']);
    expect(devotionLabel(list[2]!, going, featured)).toBe('In progress · Day 3 of 9');
    expect(devotionLabel(list[1]!, going, featured)).toBe('Its nine days are now');
    expect(devotionLabel(devotion('x', 'litany'), [], [devotion('x', 'litany')])).toBe('For this season');
    expect(devotionLabel(list[0]!, going, featured)).toBeUndefined();
  });

  it('checks route params', () => {
    expect(isMysterySet('luminous')).toBe(true);
    expect(isMysterySet('happy')).toBe(false);
    expect(isMysterySet(undefined)).toBe(false);
    expect(isDevotionKind('litany')).toBe(true);
    expect(isDevotionKind('toString')).toBe(false);
  });
});

describe('Prayer layout', () => {
  it('splits a prayer into stanzas and sense lines, keeping V. and R. apart', async () => {
    const { prayerStanzas } = await import('@/lib/prayerText');
    const stanzas = prayerStanzas('Come, Holy Spirit,\nfill the hearts of thy faithful.\n\nV. Send forth thy Spirit.\nR. And thou shalt renew the face of the earth.\n\n\nAmen.\n');
    expect(stanzas).toEqual([
      [{ marker: null, text: 'Come, Holy Spirit,' }, { marker: null, text: 'fill the hearts of thy faithful.' }],
      [{ marker: 'V.', text: 'Send forth thy Spirit.' }, { marker: 'R.', text: 'And thou shalt renew the face of the earth.' }],
      [{ marker: null, text: 'Amen.' }],
    ]);
    // A prayer with no breaks is one stanza of one line.
    expect(prayerStanzas('Hail Mary, full of grace.')).toEqual([[{ marker: null, text: 'Hail Mary, full of grace.' }]]);
  });
});

describe('Your own prayers', () => {
  const draft = { title: '  Breathe in Me ', by: ' Saint Augustine ', category: 'saints', text: '\nBreathe in me, O Holy Spirit,  \r\nthat my thoughts may all be holy.\n\n', latinText: ' ' };

  it('tidies a draft into a prayer, and waits for a title and text', () => {
    const mine = myPrayerFrom(draft, undefined, '2026-10-15T20:00:00Z')!;
    expect(mine).toMatchObject({ title: 'Breathe in Me', by: 'Saint Augustine', category: 'saints', latinText: null, createdAt: '2026-10-15T20:00:00Z' });
    expect(mine.text).toBe('Breathe in me, O Holy Spirit,\nthat my thoughts may all be holy.');
    expect(myPrayerFrom({ ...draft, title: ' ' })).toBeNull();
    expect(myPrayerFrom({ ...draft, text: '\n ' })).toBeNull();
    // Editing keeps the id and when it was added.
    const edited = myPrayerFrom({ ...draft, by: '' }, mine, '2026-10-16T08:00:00Z')!;
    expect(edited).toMatchObject({ id: mine.id, by: null, createdAt: mine.createdAt, updatedAt: '2026-10-16T08:00:00Z' });
  });

  it('files them in their section beside the book’s own, and under Yours', () => {
    const mine = asPrayer(myPrayerFrom(draft)!);
    expect(isMySlug(mine.slug)).toBe(true);
    const book = [prayer('suscipe', 'saints'), prayer('memorare', 'marian'), mine];
    expect(filterPrayers(book, '', 'saints').map((p) => p.slug)).toEqual(['suscipe', mine.slug]);
    expect(filterPrayers(book, '', YOURS)).toEqual([mine]);
    // Search finds the author too.
    expect(filterPrayers(book, 'augustine', 'marian')).toEqual([mine]);
  });
});

