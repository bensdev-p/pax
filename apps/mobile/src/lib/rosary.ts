import type { RosaryMystery } from '@/data/types';

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
