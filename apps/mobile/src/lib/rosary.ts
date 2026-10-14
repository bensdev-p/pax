import type { Prayer, RosaryMystery } from '@/data/types';

export type RosaryStep =
  | { kind: 'prayer'; slug: string; note?: string; mystery?: RosaryMystery }
  | { kind: 'mystery'; mystery: RosaryMystery }
  | { kind: 'beads'; slug: 'hail-mary'; count: number; note?: string; mystery?: RosaryMystery };

/** The order of the Rosary: opening prayers, five decades, closing prayers. */
export function rosarySteps(mysteries: RosaryMystery[]): RosaryStep[] {
  const steps: RosaryStep[] = [
    { kind: 'prayer', slug: 'sign-of-the-cross', note: 'Hold the crucifix' },
    { kind: 'prayer', slug: 'apostles-creed', note: 'On the crucifix' },
    { kind: 'prayer', slug: 'our-father', note: 'First bead' },
    { kind: 'beads', slug: 'hail-mary', count: 3, note: 'For faith, hope and charity' },
    { kind: 'prayer', slug: 'glory-be' },
  ];
  for (const mystery of mysteries) {
    steps.push(
      { kind: 'mystery', mystery },
      { kind: 'prayer', slug: 'our-father', mystery },
      { kind: 'beads', slug: 'hail-mary', count: 10, mystery },
      { kind: 'prayer', slug: 'glory-be', mystery },
      { kind: 'prayer', slug: 'fatima-prayer', mystery },
    );
  }
  steps.push(
    { kind: 'prayer', slug: 'hail-holy-queen' },
    { kind: 'prayer', slug: 'rosary-closing-prayer' },
    { kind: 'prayer', slug: 'sign-of-the-cross' },
  );
  return steps;
}

/** Steps of one decade, counting each Hail Mary: the mystery, Our Father, ten beads, Glory Be, Fatima. */
const DECADE_UNITS = 14;

/** How far through each of the five decades the Rosary is (0 to 1 each), for the progress marks. */
export function decadeProgress(steps: RosaryStep[], index: number, bead: number): number[] {
  const done = [0, 0, 0, 0, 0];
  let decade = -1;
  steps.forEach((step, i) => {
    if (step.kind === 'mystery') decade++;
    const inDecade = step.kind === 'mystery' || !!step.mystery;
    if (!inDecade || decade < 0 || decade > 4 || i > index) return;
    // Earlier steps count in full; the current one counts the Hail Marys already prayed.
    const units = step.kind === 'beads' ? step.count : 1;
    done[decade]! += i < index ? units : step.kind === 'beads' ? bead : 0;
  });
  return done.map((units) => Math.min(1, units / DECADE_UNITS));
}

/** One bead or one step back: from a decade's first Hail Mary back to the Our Father before it. */
export function stepBack(steps: RosaryStep[], index: number, bead: number): { index: number; bead: number } {
  if (bead > 0) return { index, bead: bead - 1 };
  if (index === 0) return { index: 0, bead: 0 };
  const prev = steps[index - 1]!;
  return { index: index - 1, bead: prev.kind === 'beads' ? prev.count - 1 : 0 };
}

/** A prayer's title and text in Latin when asked for and Pax has it, otherwise in English. */
export function prayerWords(
  prayer: Pick<Prayer, 'title' | 'text' | 'latin_title' | 'latin_text'> | undefined,
  latin: boolean,
): { title: string; text: string; latin: boolean } {
  if (!prayer) return { title: '', text: '', latin: false };
  if (latin && prayer.latin_text) return { title: prayer.latin_title ?? prayer.title, text: prayer.latin_text, latin: true };
  return { title: prayer.title, text: prayer.text, latin: false };
}
