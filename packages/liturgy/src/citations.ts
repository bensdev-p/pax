/**
 * Parses lectionary citations such as "Isaiah 63:16b–17, 19b; 64:2–7" into verse ranges with
 * OSIS book ids, in standard (NABRE) numbering. Verse-part letters (16b) are dropped, and only
 * the first alternative of "A or B" is kept.
 */
export interface VerseRange {
  book: string;
  chapter: number;
  verse: number;
  endChapter: number;
  endVerse: number;
}

const BOOKS: Record<string, string> = {
  genesis: 'Gen', exodus: 'Exod', leviticus: 'Lev', numbers: 'Num', deuteronomy: 'Deut',
  joshua: 'Josh', judges: 'Judg', ruth: 'Ruth', '1 samuel': '1Sam', '2 samuel': '2Sam',
  '1 kings': '1Kgs', '2 kings': '2Kgs', '1 chronicles': '1Chr', '2 chronicles': '2Chr',
  ezra: 'Ezra', nehemiah: 'Neh', tobit: 'Tob', judith: 'Jdt', esther: 'Esth',
  '1 maccabees': '1Macc', '2 maccabees': '2Macc', job: 'Job', psalm: 'Ps', psalms: 'Ps',
  proverbs: 'Prov', ecclesiastes: 'Eccl', 'song of songs': 'Song', 'song of solomon': 'Song',
  wisdom: 'Wis', sirach: 'Sir', isaiah: 'Isa', jeremiah: 'Jer', lamentations: 'Lam',
  baruch: 'Bar', ezekiel: 'Ezek', daniel: 'Dan', hosea: 'Hos', joel: 'Joel', amos: 'Amos',
  obadiah: 'Obad', jonah: 'Jonah', micah: 'Mic', nahum: 'Nah', habakkuk: 'Hab',
  zephaniah: 'Zeph', haggai: 'Hag', zechariah: 'Zech', malachi: 'Mal', matthew: 'Matt',
  mark: 'Mark', luke: 'Luke', john: 'John', acts: 'Acts', 'acts of the apostles': 'Acts',
  romans: 'Rom', '1 corinthians': '1Cor', '2 corinthians': '2Cor', galatians: 'Gal',
  ephesians: 'Eph', philippians: 'Phil', colossians: 'Col', '1 thessalonians': '1Thess',
  '2 thessalonians': '2Thess', '1 timothy': '1Tim', '2 timothy': '2Tim', titus: 'Titus',
  philemon: 'Phlm', hebrews: 'Heb', james: 'Jas', '1 peter': '1Pet', '2 peter': '2Pet',
  '1 john': '1John', '2 john': '2John', '3 john': '3John', jude: 'Jude', revelation: 'Rev',
  // Misspellings seen in the source data.
  phiippians: 'Phil', sirarch: 'Sir',
};

/** Books with one chapter, often cited without it ("Philemon 9–10"). */
const ONE_CHAPTER = new Set(['Obad', 'Phlm', '2John', '3John', 'Jude']);

const DASH = /[-–—]/;

export function parseCitation(citation: string): VerseRange[] {
  const first = citation.split(/\s+or\s+/i)[0]!.trim();
  const m = /^((?:[1-3]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d.*)$/.exec(first);
  if (!m) return [];
  const book = BOOKS[m[1]!.toLowerCase()];
  if (!book) return [];
  const ranges: VerseRange[] = [];
  let chapter = ONE_CHAPTER.has(book) ? 1 : 0;
  for (const group of m[2]!.split(';')) {
    for (const rawPart of group.split(/,|\band\b/)) {
      const part = rawPart.trim().replace(/(\d)\s*[a-e]+\b/g, '$1');
      if (!part) continue;
      const [startRaw, endRaw] = part.split(DASH).map((s) => s.trim());
      if (!startRaw) continue;
      let verse: number;
      if (startRaw.includes(':')) {
        const [c, v] = startRaw.split(':');
        chapter = Number(c);
        verse = Number(v);
      } else {
        verse = Number(startRaw);
      }
      let endChapter = chapter;
      let endVerse = verse;
      if (endRaw) {
        if (endRaw.includes(':')) {
          const [c, v] = endRaw.split(':');
          endChapter = Number(c);
          endVerse = Number(v);
        } else {
          endVerse = Number(endRaw);
        }
      }
      if (!chapter || !verse || Number.isNaN(endVerse)) continue;
      ranges.push({ book, chapter, verse, endChapter, endVerse });
    }
  }
  return ranges;
}

/** OSIS key of the first verse cited, e.g. "Isa.63.16". */
export function citationStart(citation: string): string | null {
  const r = parseCitation(citation)[0];
  return r ? `${r.book}.${r.chapter}.${r.verse}` : null;
}

/** Whether a standard-numbered verse falls inside any of the ranges. */
export function rangesInclude(ranges: VerseRange[], book: string, chapter: number, verse: number): boolean {
  return ranges.some(
    (r) =>
      r.book === book &&
      (chapter > r.chapter || (chapter === r.chapter && verse >= r.verse)) &&
      (chapter < r.endChapter || (chapter === r.endChapter && verse <= r.endVerse)),
  );
}
