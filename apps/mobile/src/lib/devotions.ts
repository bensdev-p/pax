import { addDays, dateOfCelebration } from '@pax/liturgy';

import type { Devotion, NovenaProgress } from '@/data/types';

export const KIND_LABELS: Record<Devotion['kind'], string> = {
  chaplet: 'Chaplet',
  stations: 'Stations',
  litany: 'Litany',
  novena: 'Novena',
};

export const NOVENA_DAYS = 9;

/** The nine days that end the day before the novena's feast, in the year still ahead. */
export async function novenaWindow(anchor: string, today: string): Promise<{ start: string; end: string; feast: string } | null> {
  const year = Number(today.slice(0, 4));
  for (const y of [year, year + 1]) {
    const feast = await dateOfCelebration(anchor, y);
    if (!feast) continue;
    const end = addDays(feast, -1);
    if (end >= today) return { start: addDays(feast, -NOVENA_DAYS), end, feast };
  }
  return null;
}

/** 0-based day whose prayer to show: the next one, or today's again if already prayed today. */
export function novenaDayIndex(progress: NovenaProgress | undefined, today: string): number {
  if (!progress) return 0;
  const index = progress.lastPrayedOn === today ? progress.daysDone - 1 : progress.daysDone;
  return Math.max(0, Math.min(NOVENA_DAYS - 1, index));
}

/** Progress after finishing today's prayer; praying twice in a day counts once. */
export function afterPraying(
  progress: NovenaProgress | undefined,
  devotion: Pick<Devotion, 'slug' | 'title'>,
  today: string,
): NovenaProgress {
  const base: NovenaProgress = progress ?? {
    slug: devotion.slug,
    title: devotion.title,
    startedOn: today,
    daysDone: 0,
    lastPrayedOn: null,
    reminderTime: null,
  };
  if (base.lastPrayedOn === today) return base;
  return { ...base, daysDone: Math.min(NOVENA_DAYS, base.daysDone + 1), lastPrayedOn: today };
}
