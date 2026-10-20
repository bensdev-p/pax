import type { DaySnapshot } from '@pax/liturgy';
import type { Href } from 'expo-router';

import { verseLabel, type LibraryStore } from '@/data/library';
import type { ContentStore } from '@/data/types';

import { excerptSource } from './catena';
import { dailyWordFor, workTitle } from './dailyWord';

/** "A word for today" ready to show, on Today and in the Word for today widget. */
export interface DailyWordText {
  label: string;
  text: string;
  source: string;
  href: Href;
}

/** Looks up the day's verse, saint's quote or Father's excerpt; null if it isn't in the library. */
export async function loadDailyWord(
  day: Pick<DaySnapshot, 'date' | 'season'>,
  content: Pick<ContentStore, 'saint'>,
  library: Pick<LibraryStore, 'passage' | 'fatherPassage'>,
): Promise<DailyWordText | null> {
  const pick = dailyWordFor(day);
  if (pick.kind === 'verse') {
    const verses = (await library.passage(pick.citation)).flat();
    const first = verses[0];
    if (!first) return null;
    const last = verses.at(-1)!;
    const range = last.douay_verse !== first.douay_verse ? `–${last.douay_verse}` : '';
    return {
      label: 'A verse for today',
      text: verses.map((v) => v.text).join(' '),
      source: `${verseLabel(first)}${range} · Douay-Rheims`,
      href: { pathname: '/verse/[ref]', params: { ref: first.ref } },
    };
  }
  if (pick.kind === 'saint') {
    const saint = await content.saint(pick.key);
    if (!saint?.quote) return null;
    return {
      label: 'From the saints',
      text: saint.quote,
      source: [saint.name, saint.quote_source].filter(Boolean).join(' · '),
      href: { pathname: '/saint/[key]', params: { key: saint.romcal_key } },
    };
  }
  const excerpt = await library.fatherPassage(pick.slug);
  if (!excerpt) return null;
  const from = excerptSource(excerpt);
  return {
    label: 'From the Church Fathers',
    text: from.text.replace(/\s*\n\s*\n\s*/g, ' '),
    source: `${excerpt.author} · ${from.work ? workTitle(from.work) : `via ${from.via}`}`,
    href: { pathname: '/fathers/[author]', params: { author: excerpt.author_slug, name: excerpt.author } },
  };
}
