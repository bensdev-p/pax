/**
 * First-run onboarding (SPEC: Planned screens). The answer to "What brings you here?" is used
 * only to suggest a plan and is never stored (decided with Ben); only `settings.onboarded` is.
 */
export type Reason = 'curious' | 'ocia' | 'received' | 'deeper';

export const REASONS: { value: Reason; label: string; detail: string }[] = [
  { value: 'curious', label: 'Just curious', detail: 'Getting to know the Catholic faith' },
  { value: 'ocia', label: 'I’m in OCIA', detail: 'On the way to becoming Catholic' },
  { value: 'received', label: 'Newly received', detail: 'Recently baptized or welcomed into the Church' },
  { value: 'deeper', label: 'Going deeper', detail: 'Catholic, and wanting more of a daily rhythm' },
];

/** The plan Pax suggests for each answer, and for OCIA the one to take up after it. */
export function suggestedPlan(reason: Reason | null): { slug: string; then?: string } {
  switch (reason) {
    case 'ocia':
      return { slug: 'mark-in-16-days', then: 'catechism-in-a-year' };
    case 'received':
      return { slug: 'acts-in-28-days' };
    case 'deeper':
      return { slug: 'bible-in-a-year' };
    default:
      return { slug: 'mark-in-16-days' };
  }
}

/**
 * Show onboarding on a new install only: anyone who already has activity, a plan, a novena,
 * reminders or a reading position has used Pax before and is marked onboarded quietly.
 */
export function needsOnboarding(state: {
  onboarded: boolean;
  longestStreak: number;
  plans: number;
  novenas: number;
  remindersOn: boolean;
  hasReadingPosition: boolean;
}): 'show' | 'mark-done' | 'no' {
  if (state.onboarded) return 'no';
  const usedBefore = state.longestStreak > 0 || state.plans > 0 || state.novenas > 0 || state.remindersOn || state.hasReadingPosition;
  return usedBefore ? 'mark-done' : 'show';
}
