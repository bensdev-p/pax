import { toIsoDate, type DaySnapshot } from '@pax/liturgy';
import { useEffect, useState } from 'react';

import { useContent } from '@/data/content';
import type { Devotion } from '@/data/types';
import { novenaWindow } from '@/lib/devotions';

const SEASON_TAGS: Record<string, string> = { LENT: 'LENT', PASCHAL_TRIDUUM: 'LENT', EASTER_TIME: 'EASTER', ADVENT: 'ADVENT' };

/**
 * All devotions, and the ones to feature today: novenas whose nine days before the feast
 * include today, and chaplets, litanies or the Stations that belong to the season.
 */
export function useDevotions(today: DaySnapshot | null): { devotions: Devotion[]; featured: Devotion[] } {
  const content = useContent();
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [novenasNow, setNovenasNow] = useState<string[]>([]);
  const date = today?.date ?? toIsoDate(new Date());

  useEffect(() => {
    void content.devotions().then(setDevotions);
  }, [content]);

  useEffect(() => {
    void Promise.all(
      devotions
        .filter((d) => d.anchor)
        .map(async (d) => {
          const w = await novenaWindow(d.anchor!, date);
          return w && w.start <= date ? d.slug : null;
        }),
    ).then((slugs) => setNovenasNow(slugs.filter((s): s is string => !!s)));
  }, [devotions, date]);

  const seasonTag = today ? SEASON_TAGS[today.season] : undefined;
  const featured = devotions.filter((d) => novenasNow.includes(d.slug) || (d.kind !== 'novena' && !!seasonTag && d.season === seasonTag));
  return { devotions, featured };
}
