import type { DaySnapshot } from '@pax/liturgy';

/**
 * "A word for today" on Today: a verse one day, a saint or Church Father the next. Verses are
 * cited in standard (NABRE) numbering and shown in the Douay-Rheims; quotes come from the
 * saints' write-ups (their public-domain quotes) and the bundled Fathers starter set. Every
 * entry was checked against content.db (test/rhythm.test.ts); add more by appending here.
 */
const VERSES: Record<'ORDINARY' | 'ADVENT' | 'CHRISTMAS_TIME' | 'LENT' | 'EASTER_TIME', string[]> = {
  ORDINARY: [
    'Psalm 23:4', 'Psalm 27:14', 'Psalm 34:9', 'Psalm 37:5', 'Psalm 46:11', 'Psalm 51:12', 'Psalm 62:2',
    'Psalm 63:2', 'Psalm 84:11', 'Psalm 90:14', 'Psalm 91:11', 'Psalm 103:2–3', 'Psalm 118:24',
    'Psalm 119:105', 'Psalm 121:1–2', 'Psalm 139:14', 'Psalm 145:18', 'Proverbs 3:5–6', 'Ecclesiastes 3:1',
    'Wisdom 3:1', 'Isaiah 40:31', 'Isaiah 41:10', 'Isaiah 43:1', 'Isaiah 55:8–9', 'Jeremiah 29:11',
    'Lamentations 3:22–23', 'Micah 6:8', 'Zephaniah 3:17', 'Matthew 5:8', 'Matthew 6:33', 'Matthew 11:28–29',
    'Matthew 28:20', 'Mark 10:27', 'Luke 1:37', 'Luke 6:36', 'Luke 11:9', 'John 3:16', 'John 8:12',
    'John 10:10', 'John 14:6', 'John 14:27', 'John 15:5', 'John 15:13', 'Romans 8:28', 'Romans 8:38–39',
    'Romans 12:12', '1 Corinthians 10:13', '1 Corinthians 13:13', '2 Corinthians 5:17', '2 Corinthians 12:9',
    'Galatians 2:20', 'Galatians 5:22–23', 'Philippians 4:6–7', 'Philippians 4:13', 'Colossians 3:14',
    '1 Thessalonians 5:16–18', 'Hebrews 11:1', 'Hebrews 13:8', 'James 1:5', '1 Peter 5:7', '1 John 4:16',
    '1 John 4:19', 'Revelation 3:20', 'Psalm 16:11', 'Psalm 19:2', 'Psalm 42:2', 'Psalm 100:3',
    'Isaiah 30:15', 'Matthew 5:14', 'Luke 10:41–42', 'Psalm 55:23',
  ],
  ADVENT: [
    'Isaiah 7:14', 'Isaiah 9:5', 'Isaiah 11:1–2', 'Isaiah 40:3', 'Isaiah 45:8', 'Isaiah 61:1', 'Micah 5:1',
    'Psalm 40:2', 'Psalm 80:4', 'Psalm 85:11–12', 'Malachi 3:1', 'Luke 1:38', 'Luke 1:46–47',
    'Romans 13:11–12', 'Philippians 4:4–5', 'James 5:8', 'Revelation 22:20', 'Zechariah 9:9', 'Isaiah 35:4',
    'Habakkuk 2:3',
  ],
  CHRISTMAS_TIME: [
    'John 1:14', 'Luke 2:10–11', 'Luke 2:14', 'Luke 2:19', 'Isaiah 9:1', 'Matthew 1:23', 'Matthew 2:10–11',
    'Galatians 4:4–5', 'Titus 2:11', '1 John 1:1', 'Hebrews 1:1–2', 'John 1:5', 'Psalm 98:3', 'Luke 2:30–32',
  ],
  LENT: [
    'Joel 2:12–13', 'Psalm 51:3', 'Psalm 51:12', 'Psalm 51:19', 'Psalm 34:19', 'Psalm 130:3–4', 'Isaiah 1:18',
    'Isaiah 53:5', 'Isaiah 58:6–7', 'Ezekiel 36:26', 'Hosea 6:6', 'Matthew 4:4', 'Matthew 6:6',
    'Matthew 16:24', 'Mark 1:15', 'Luke 15:20', 'Luke 18:13', 'John 3:17', 'Psalm 143:10', 'Romans 5:5',
    '2 Corinthians 5:20', '2 Corinthians 6:2', 'Philippians 2:8', 'Hebrews 4:15–16', '1 John 1:9',
  ],
  EASTER_TIME: [
    'Matthew 28:6', 'Luke 24:32', 'John 11:25', 'John 20:21', 'John 20:29', 'John 21:17', 'Acts 2:38',
    'Acts 4:12', 'Romans 6:4', 'Romans 6:9', '1 Corinthians 15:20', '1 Corinthians 15:55',
    '2 Corinthians 4:16', 'Colossians 3:1–2', '1 Peter 1:3', '1 Peter 2:9', 'Revelation 21:5',
    'Psalm 118:22–23', 'John 14:2', 'John 16:22', 'Acts 1:8', 'Romans 8:11', 'Galatians 5:25', 'John 15:9',
    'Revelation 1:17–18',
  ],
};

/** Saints whose write-up carries a quote from their own writings (romcal keys). */
const SAINT_QUOTES = [
  'augustine_of_hippo_bishop', 'irenaeus_of_lyon_bishop', 'benedict_of_nursia_abbot', 'teresa_of_jesus_of_avila_virgin',
  'leo_i_the_great_pope', 'jerome_of_stridon_priest', 'athanasius_of_alexandria_bishop', 'anselm_of_canterbury_bishop',
  'ignatius_of_antioch_bishop', 'clement_i_pope', 'john_fisher_bishop_and_thomas_more_martyrs',
  'bonaventure_of_bagnoregio_bishop', 'polycarp_of_smyrna_bishop', 'ignatius_of_loyola_priest',
  'cornelius_i_pope_and_cyprian_of_carthage_bishop_martyrs', 'hilary_of_poitiers_bishop',
  'basil_the_great_and_gregory_nazianzen_bishops', 'perpetua_of_carthage_and_felicity_of_carthage_martyrs',
  'john_henry_newman_priest',
];

/** Short, self-contained excerpts from the Fathers starter set (father_passages slugs). */
const FATHER_QUOTES = [
  'augustine-of-hippo-1e0612359f', 'ambrose-of-milan-addfff229e', 'jerome-1775098be9', 'origen-of-alexandria-600b20d098',
  'ambrose-of-milan-59f5e76735', 'tertullian-7b1f5eaf93', 'theophylact-of-ohrid-a15c9cc845', 'jerome-bbe044d202',
  'augustine-of-hippo-1bc76930c7', 'cyril-of-alexandria-26ba21104d', 'ambrose-of-milan-a52b396923',
  'john-chrysostom-2466fb235e', 'jerome-bd2d948864', 'ambrose-of-milan-eec6589cd8', 'theophylact-of-ohrid-6d3d124394',
  'tertullian-930dea5c8a', 'augustine-of-hippo-8f5f77e473', 'ambrose-of-milan-b213206c47',
  'theophylact-of-ohrid-c7e90d9a9e', 'basil-of-caesarea-594d8dec0c', 'ambrose-of-milan-74ac79fc87',
];

export type DailyWord =
  | { kind: 'verse'; citation: string }
  | { kind: 'saint'; key: string }
  | { kind: 'father'; slug: string };

/** Saints and Fathers taking turns. */
const QUOTES: DailyWord[] = Array.from({ length: Math.max(SAINT_QUOTES.length, FATHER_QUOTES.length) }, (_, i) => [
  ...(SAINT_QUOTES[i] ? [{ kind: 'saint' as const, key: SAINT_QUOTES[i] }] : []),
  ...(FATHER_QUOTES[i] ? [{ kind: 'father' as const, slug: FATHER_QUOTES[i] }] : []),
]).flat();

/** Days since 2000-01-01, so the rotation is the same everywhere for a given date. */
function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / 86_400_000);
}

/** Even days a verse (for the season), odd days a saint or a Father, taking turns. */
export function dailyWordFor(day: Pick<DaySnapshot, 'date' | 'season'>): DailyWord {
  const n = dayNumber(day.date);
  const half = Math.floor(n / 2);
  if (n % 2 === 0) {
    const list =
      day.season === 'ADVENT' || day.season === 'CHRISTMAS_TIME' || day.season === 'LENT' || day.season === 'EASTER_TIME'
        ? VERSES[day.season]
        : day.season === 'PASCHAL_TRIDUUM'
          ? VERSES.LENT
          : VERSES.ORDINARY;
    return { kind: 'verse', citation: list[half % list.length]! };
  }
  return QUOTES[half % QUOTES.length]!;
}

export const DAILY_WORDS = { VERSES, SAINT_QUOTES, FATHER_QUOTES };

/** "SERMONS ON NEW TESTAMENT LESSONS 65.1" → "Sermons on New Testament Lessons 65.1". */
export function workTitle(title: string): string {
  if (title !== title.toUpperCase()) return title;
  const small = new Set(['on', 'of', 'the', 'and', 'to', 'in', 'for', 'a']);
  return title
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}
