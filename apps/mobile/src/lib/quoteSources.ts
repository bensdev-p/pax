import { parseCitation } from '@pax/liturgy';

/**
 * Where a saint's quote can be read in full (decided with Ben): quotes from Scripture open in
 * Pax's Douay-Rheims reader; quotes from the saints' own writings open the whole work online,
 * in a public-domain edition, at the quoted chapter where the site allows. When Phase 4 adds a
 * work as a reading course in Pax, point its quote there instead. Keyed by romcal key.
 * Jerome's commentary on Isaiah has no public-domain English text online, so it has no link.
 */
const WORK_URLS: Record<string, string> = {
  augustine_of_hippo_bishop: 'https://www.newadvent.org/fathers/110101.htm',
  irenaeus_of_lyon_bishop: 'https://www.newadvent.org/fathers/0103420.htm',
  athanasius_of_alexandria_bishop: 'https://www.newadvent.org/fathers/2802.htm',
  basil_the_great_and_gregory_nazianzen_bishops: 'https://www.newadvent.org/fathers/310229.htm',
  clement_i_pope: 'https://www.newadvent.org/fathers/1010.htm',
  cornelius_i_pope_and_cyprian_of_carthage_bishop_martyrs: 'https://www.newadvent.org/fathers/050701.htm',
  cyril_of_jerusalem_bishop: 'https://www.newadvent.org/fathers/3101.htm',
  hilary_of_poitiers_bishop: 'https://www.newadvent.org/fathers/330212.htm',
  ignatius_of_antioch_bishop: 'https://www.newadvent.org/fathers/0107.htm',
  justin_martyr: 'https://www.newadvent.org/fathers/0126.htm',
  leo_i_the_great_pope: 'https://www.newadvent.org/fathers/360321.htm',
  perpetua_of_carthage_and_felicity_of_carthage_martyrs: 'https://www.newadvent.org/fathers/0324.htm',
  polycarp_of_smyrna_bishop: 'https://www.newadvent.org/fathers/0102.htm',
  thomas_aquinas_priest: 'https://www.newadvent.org/summa/1001.htm#article8',
  anselm_of_canterbury_bishop: 'https://sourcebooks.web.fordham.edu/basis/anselm-proslogium.asp',
  benedict_of_nursia_abbot: 'https://www.ccel.org/ccel/benedict/rule.html',
  ignatius_of_loyola_priest: 'https://www.ccel.org/ccel/ignatius/exercises.all.html',
  bonaventure_of_bagnoregio_bishop:
    'https://kolbefoundation.org/gbookswebsite/studentlibrary/greatestbooks/aaabooks/bonaventure/mindsroadtogod.html',
  john_fisher_bishop_and_thomas_more_martyrs: 'https://luminarium.org/renlit/moremeditation.htm',
  john_henry_newman_priest: 'https://rpo.library.utoronto.ca/poems/pillar-cloud',
  teresa_of_jesus_of_avila_virgin: 'https://www.gutenberg.org/ebooks/78406',
};

export type QuoteSource = { kind: 'scripture'; citation: string } | { kind: 'work'; url: string };

export function quoteSource(saint: { romcal_key: string; quote_source: string | null }): QuoteSource | null {
  const url = WORK_URLS[saint.romcal_key];
  if (url) return { kind: 'work', url };
  if (saint.quote_source && parseCitation(saint.quote_source).length) return { kind: 'scripture', citation: saint.quote_source };
  return null;
}

export const QUOTE_WORK_KEYS = Object.keys(WORK_URLS);
