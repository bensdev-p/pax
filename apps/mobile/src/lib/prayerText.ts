/** One sense line of a prayer; versicles and responses keep their "V." or "R." apart. */
export interface PrayerLine {
  marker: 'V.' | 'R.' | null;
  text: string;
}

/**
 * A prayer laid out as it's printed in a prayer book (pipeline/seed/prayers.json): stanzas
 * split by a blank line, one sense line per line.
 */
export function prayerStanzas(text: string): PrayerLine[][] {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((stanza) =>
      stanza
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const m = /^([VR]\.)\s+(.*)$/.exec(line);
          return m ? { marker: m[1] as 'V.' | 'R.', text: m[2]! } : { marker: null, text: line };
        }),
    )
    .filter((stanza) => stanza.length > 0);
}
