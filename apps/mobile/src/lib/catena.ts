/**
 * The Catena Aurea ("Golden Chain") is Aquinas's commentary on the four Gospels made entirely of
 * quotations from the Fathers. The library files those quotations under the Father who wrote
 * them, with the Catena as the "work" and Aquinas's own citation in brackets at the start of
 * the text: "(de Con. Evan. l. ii. c. 46) What Luke expresses…". Pax shows the Father's work
 * as the source (Harmony of the Gospels 2.46), notes that it comes via the Catena, and starts
 * the text after the citation (decided with Ben).
 */

export const CATENA_WORK = 'Catena Aurea by Aquinas';
const VIA = 'Aquinas’s Catena Aurea';

export interface ExcerptSource {
  /** The Father's own work, when the citation names one; otherwise the work as filed. */
  work: string | null;
  /** The collection it was quoted in, when it reached the library that way. */
  via: string | null;
  text: string;
}

/**
 * Aquinas's pointers that name no work: "where cited above", "not found", "on this verse",
 * "from Bede", "as found in…".
 */
const POINTERS = /^((ubi sup|ut sup|sup|non occ|non o|in loc|ord|ordin|interlin|vide)\b|ap\.|e bed)/i;
/** The same pointers after a name ("Chrysologus ubi sup."). */
const TRAILING_POINTER = /\b(ubi sup|ut sup|non occ)\b/i;

type Rule = [RegExp, string];

/** Abbreviations Aquinas uses, by Father, for the works they're quoted from most. */
const RULES: Record<string, Rule[]> = {
  'augustine-of-hippo': [
    [/\b(de )?cons?\.( ev(an(g)?)?\.?)?/i, 'Harmony of the Gospels'],
    [/\bserm\. in mont\./i, 'Sermon on the Mount'],
    [/\bde verb\. dom\.( (s|serm)\.)?/i, 'Sermons on the Lord’s Words'],
    [/\bserm\./i, 'Sermon'],
    [/\bde civ\. dei,?/i, 'City of God'],
    [/\blib\. lxxxiii\. qu(æ|ae)st\./i, 'Eighty-three Questions'],
    [/\b(de )?qu(æ|ae)?st?\. in matt\./i, 'Questions on Matthew'],
    [/\b(de )?qu(æ|ae)?(st)?\. ev(an(g)?)?\./i, 'Questions on the Gospels'],
    [/\bde trin\./i, 'On the Trinity'],
    [/\bcont\. faust\./i, 'Against Faustus'],
    [/\b(ad hesych\. )?ep(ist)?\./i, 'Letter'],
    [/\b(in )?enchir(id)?\./i, 'Enchiridion'],
    [/\bde doctr\. christ\./i, 'On Christian Doctrine'],
    [/\bde op\. monach\./i, 'On the Work of Monks'],
    [/\b(in joan\. )?tr(act)?\.( in joan\.)?/i, 'Tractates on John'],
  ],
  'john-chrysostom': [
    [/\bhom\.(.*)in matt\./i, 'Homilies on Matthew'],
    [/\bhom\.(.*)in joan\./i, 'Homilies on John'],
    [/\bhom\.(.*)in act\./i, 'Homilies on Acts'],
    [/\bhom\.(.*)in gen\./i, 'Homilies on Genesis'],
    [/\bhom\.(.*)in 1 ad cor\./i, 'Homilies on 1 Corinthians'],
    [/\bconc\.(.*)de lazaro\./i, 'Sermons on Lazarus'],
    [/\bhom\./i, 'Homily'],
  ],
  'gregory-the-dialogist': [
    [/\b(in )?hom\.(.*)in ezech\./i, 'Homilies on Ezekiel'],
    [/\b(in )?hom\.(.*)in ev(an(g)?)?\./i, 'Homilies on the Gospels'],
    [/\bmor(?:al)?\.(?: sup\. job [\d:]+\.?)?/i, 'Morals on Job'],
    [/\b(in )?hom\./i, 'Homilies on the Gospels'],
  ],
  'hilary-of-poitiers': [[/\bde trin\./i, 'On the Trinity']],
  'leo-the-great': [[/\bserm\./i, 'Sermon']],
  'peter-chrysologus': [[/\b(chrysologus )?serm\./i, 'Sermon']],
  'ambrose-of-milan': [[/\bin luc\./i, 'On Luke']],
  bede: [
    [/\bin marc\./i, 'On Mark'],
    [/\bin luc\.( c\.)?/i, 'On Luke'],
  ],
  'origen-of-alexandria': [
    [/\bin matt\. tom\./i, 'Commentary on Matthew'],
    [/\b(tom\. )?in joan\.( tom\.)?/i, 'Commentary on John'],
    [/\bt(om)?\./i, 'Commentary'],
  ],
  'gregory-of-nazianzus': [[/\borat\./i, 'Oration']],
  'gregory-of-nyssa': [[/\borat\. dom\. serm\./i, 'On the Lord’s Prayer']],
  'john-cassian': [[/\bcollat\./i, 'Conferences']],
  'basil-of-caesarea': [
    [/\bin esai\./i, 'On Isaiah'],
    [/\bin ps\./i, 'On the Psalms'],
  ],
  jerome: [
    [/\bin matt\./i, 'On Matthew'],
    [/\bcont\. helvid\./i, 'Against Helvidius'],
  ],
  'athanasius-of-alexandria': [[/\borat\.(.*)cont\. arian\./i, 'Against the Arians']],
  'isidore-of-pelusium': [[/\b(l(ib)?\. [ivxlc]+\. )?ep\./i, 'Letter']],
  cyprian: [[/\btr\./i, 'Treatise']],
};

const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 };

function roman(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]!]!;
    const next = ROMAN[s[i + 1] ?? ''] ?? 0;
    n += v < next ? -v : v;
  }
  return n;
}

/** Works cited by book and chapter, where a lone "l." and "c." mean "book" and "chapter". */
const BY_BOOK = /^(Harmony|Questions|City|On the Trinity|Against|Sermon on|Morals|Commentary|On Christian|Eighty)/;
/** Generic titles that say nothing without a number ("Homily" alone). */
const GENERIC = new Set(['Homily', 'Sermon', 'Letter', 'Commentary', 'Treatise', 'Oration']);

/**
 * Numbers left in a citation, as "2.46" (at most two). In works cited by book, a lone "l" or
 * "c" is "book" or "chapter"; elsewhere it's 50 or 100 ("Tr. l. 14" is Tractate 50), except a
 * "c." before a number, which is still "chapter".
 */
function numbers(rest: string, byBook: boolean): string {
  const tokens = rest
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/[^a-z0-9]+/i)
    .map((x) => x.toLowerCase())
    .filter(Boolean);
  const out: number[] = [];
  tokens.forEach((t, i) => {
    if (/^\d+$/.test(t)) out.push(Number(t));
    else if (/^[ivxlc]+$/.test(t)) {
      const label = t === 'l' || t === 'c';
      const beforeNumber = /^(\d+|[ivxlc]+)$/.test(tokens[i + 1] ?? '');
      if (!label || (!byBook && !(t === 'c' && beforeNumber))) out.push(roman(t));
    }
  });
  return out.slice(0, 2).join('.');
}

/** "Harmony of the Gospels 2.46", or the citation as Aquinas wrote it when it isn't one we know. */
export function readCitation(authorSlug: string, cite: string): string | null {
  const c = cite.trim().replace(/[.,;\s]+$/, '');
  if (!c || POINTERS.test(c)) return null;
  // Abbreviations end in a period, so match on a citation that does too ("de Trin" → "de Trin.").
  const dotted = `${c}.`;
  for (const [pattern, title] of RULES[authorSlug] ?? []) {
    const m = pattern.exec(dotted);
    if (!m) continue;
    // Keep what the pattern skipped over ("Hom. 27. in Matt." keeps the 27).
    const rest = [dotted.slice(0, m.index), ...m.slice(1).filter(Boolean), dotted.slice(m.index + m[0].length)].join(' ');
    const n = numbers(rest, BY_BOOK.test(title));
    if (n) return `${title} ${n}`;
    return GENERIC.has(title) ? c : title;
  }
  return TRAILING_POINTER.test(c) ? null : c;
}

/** Where an excerpt comes from and its text, with Aquinas's citation moved out of the text. */
export function excerptSource(e: { author_slug: string; work: string; text: string }): ExcerptSource {
  if (e.work !== CATENA_WORK) return { work: e.work, via: null, text: e.text };
  const m = /^\s*\(([^()]{1,80})\)\s*/.exec(e.text);
  if (!m) return { work: null, via: VIA, text: e.text };
  return { work: readCitation(e.author_slug, m[1]!), via: VIA, text: e.text.slice(m[0].length) };
}
