import { describe, expect, it } from 'vitest';

import { citationStart, parseCitation, rangesInclude } from '../src';

describe('parseCitation', () => {
  it('handles verse parts, lists and chapter changes', () => {
    expect(parseCitation('Isaiah 63:16b–17, 19b; 64:2–7')).toEqual([
      { book: 'Isa', chapter: 63, verse: 16, endChapter: 63, endVerse: 17 },
      { book: 'Isa', chapter: 63, verse: 19, endChapter: 63, endVerse: 19 },
      { book: 'Isa', chapter: 64, verse: 2, endChapter: 64, endVerse: 7 },
    ]);
  });

  it('handles psalm responses with "and"', () => {
    expect(parseCitation('Psalm 51:3–4, 5–6ab, 12–13, 14 and 17').map((r) => [r.verse, r.endVerse])).toEqual([
      [3, 4],
      [5, 6],
      [12, 13],
      [14, 14],
      [17, 17],
    ]);
  });

  it('handles ranges across chapters and numbered books', () => {
    expect(parseCitation('2 Corinthians 5:20—6:2')).toEqual([
      { book: '2Cor', chapter: 5, verse: 20, endChapter: 6, endVerse: 2 },
    ]);
  });

  it('handles one-chapter books and spaced verse parts', () => {
    expect(parseCitation('Philemon 9–10, 12–17')[0]).toEqual({ book: 'Phlm', chapter: 1, verse: 9, endChapter: 1, endVerse: 10 });
    expect(parseCitation('Sirach 51:12 cd–20')[0]).toEqual({ book: 'Sir', chapter: 51, verse: 12, endChapter: 51, endVerse: 20 });
  });

  it('keeps the first alternative and ignores unknown books', () => {
    expect(parseCitation('Romans 5:12–19 or 5:12, 17–19')).toHaveLength(1);
    expect(parseCitation('Gaudium et Spes 22')).toEqual([]);
  });

  it('gives the first verse and tests membership', () => {
    expect(citationStart('Luke 11:1–4')).toBe('Luke.11.1');
    const r = parseCitation('Mark 13:33–37');
    expect(rangesInclude(r, 'Mark', 13, 35)).toBe(true);
    expect(rangesInclude(r, 'Mark', 13, 38)).toBe(false);
  });
});
