/**
 * The nightly Examen (Phase 4, layout chosen with Ben from mockups): five short steps after Saint
 * Ignatius, one screen each, ending with the Our Father. The words are Pax's own.
 */
export interface ExamenStep {
  title: string;
  guide: string;
  question: string;
}

export const EXAMEN_STEPS: ExamenStep[] = [
  {
    title: 'Give thanks',
    guide: 'Look back over today and notice its gifts: a person, a meal, a word, a moment of beauty. Thank God for one or two of them by name.',
    question: 'What am I most grateful for today?',
  },
  {
    title: 'Ask for light',
    guide: 'Ask the Holy Spirit to help you see this day as God sees it: honestly, without fear, and with love.',
    question: 'Lord, what do you want me to see?',
  },
  {
    title: 'Walk through the day',
    guide: 'Go back through the day from waking until now, hour by hour. Notice where you felt close to God, and where you drifted from him.',
    question: 'Where was God in my day? Where did I turn away?',
  },
  {
    title: 'Ask for mercy',
    guide: 'Name a moment you fell short, in thought, word or deed, or in what you failed to do. Tell God you are sorry, and trust his mercy.',
    question: 'What do I want to bring to God for healing?',
  },
  {
    title: 'Look to tomorrow',
    guide: 'Ask for the grace you will need tomorrow, and choose one small thing to do differently. Then end with the Our Father.',
    question: 'What grace will I ask for tomorrow?',
  },
];

/** From this hour, Today suggests the Examen for the Pray mark (SPEC: Today). */
export const EVENING_HOUR = 18;

export const EXAMEN_TAG = 'examen';

/** The optional write-down as one journal entry; null when both answers are empty. */
export function examenEntry(grateful: string, tomorrow: string): string | null {
  const lines = [
    grateful.trim() ? `Grateful for: ${grateful.trim()}` : null,
    tomorrow.trim() ? `Tomorrow I’ll ask for: ${tomorrow.trim()}` : null,
  ].filter(Boolean);
  return lines.length ? lines.join('\n\n') : null;
}
