import { describe, expect, it } from 'vitest';

import { CATENA_WORK, excerptSource, readCitation } from '@/lib/catena';

describe('Catena Aurea citations', () => {
  it('names the Father’s own work from Aquinas’s abbreviation', () => {
    expect(readCitation('augustine-of-hippo', 'Con. Evang. iii. 24')).toBe('Harmony of the Gospels 3.24');
    expect(readCitation('augustine-of-hippo', 'de Con. Evan. l. ii. c. xlvi')).toBe('Harmony of the Gospels 2.46');
    expect(readCitation('augustine-of-hippo', 'Tr. xlv. 15')).toBe('Tractates on John 45.15');
    expect(readCitation('augustine-of-hippo', 'de Civ. Dei, l. iii. c. 15.')).toBe('City of God 3.15');
    expect(readCitation('john-chrysostom', 'Hom. 27. in Matt.')).toBe('Homilies on Matthew 27');
    expect(readCitation('gregory-the-dialogist', 'ii. Mor. 11')).toBe('Morals on Job 2.11');
    expect(readCitation('gregory-the-dialogist', 'xix. Mor. sup. Job 28:23.')).toBe('Morals on Job 19');
    expect(readCitation('hilary-of-poitiers', 'vii. de Trin')).toBe('On the Trinity 7');
  });

  it('reads a lone "l" or "c" as a number only where it can’t mean book or chapter', () => {
    expect(readCitation('augustine-of-hippo', 'Tr. l. 14')).toBe('Tractates on John 50.14');
    expect(readCitation('augustine-of-hippo', 'Tr. c')).toBe('Tractates on John 100');
    expect(readCitation('augustine-of-hippo', 'Tr. xvi. c. 3')).toBe('Tractates on John 16.3');
    expect(readCitation('augustine-of-hippo', 'de Con. l. 2. c. 30.')).toBe('Harmony of the Gospels 2.30');
  });

  it('drops pointers and keeps citations it doesn’t know as written', () => {
    expect(readCitation('bede', 'ubi sup.')).toBeNull();
    expect(readCitation('glossa-ordinaria', 'non occ.')).toBeNull();
    expect(readCitation('peter-chrysologus', 'Chrysologus ubi sup.')).toBeNull();
    expect(readCitation('rabanus-maurus', 'e Beda.')).toBeNull();
    expect(readCitation('remigius-of-rheims', 'ap. Raban.')).toBeNull();
    expect(readCitation('glossa-ordinaria', 'ap. Anselm.')).toBeNull();
    expect(readCitation('bede', 'ordin.')).toBeNull();
    expect(readCitation('ancient-greek-expositor', 'Severus.')).toBe('Severus');
    expect(readCitation('john-chrysostom', 'Hom. de Patre et duobus Filiis.')).toBe('Hom. de Patre et duobus Filiis');
  });

  it('moves the citation out of the text and notes the Catena', () => {
    const text = '(Con. Evang. iii. 24) What Luke expresses by very early in the morning…';
    expect(excerptSource({ author_slug: 'augustine-of-hippo', work: CATENA_WORK, text })).toEqual({
      work: 'Harmony of the Gospels 3.24',
      via: 'Aquinas’s Catena Aurea',
      text: 'What Luke expresses by very early in the morning…',
    });
    expect(excerptSource({ author_slug: 'bede', work: CATENA_WORK, text: '(ubi sup.) He came.' })).toMatchObject({ work: null, text: 'He came.' });
    expect(excerptSource({ author_slug: 'bede', work: CATENA_WORK, text: 'No citation here.' })).toMatchObject({ work: null, text: 'No citation here.' });
    // Other works are left alone, brackets and all.
    expect(excerptSource({ author_slug: 'augustine-of-hippo', work: 'Sermon 233.3-4', text: '(As he said) He died.' })).toEqual({
      work: 'Sermon 233.3-4',
      via: null,
      text: '(As he said) He died.',
    });
  });
});
