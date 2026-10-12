import type { Note, NoteKind, NoteTarget } from '@/data/types';

/** The four highlight colors (soft washes; the swatch is the stronger tone). */
export const HIGHLIGHT_COLORS = {
  yellow: { label: 'Yellow', swatch: '#F5C518', wash: '#FFF3B0', washDark: '#5A4A0E' },
  green: { label: 'Green', swatch: '#4CB866', wash: '#D9F2DE', washDark: '#1E4A2A' },
  blue: { label: 'Blue', swatch: '#3D9BE0', wash: '#D8ECFA', washDark: '#173A55' },
  pink: { label: 'Pink', swatch: '#E86A9A', wash: '#FBDCE8', washDark: '#552238' },
} as const;
export type HighlightColor = keyof typeof HIGHLIGHT_COLORS;
export const isHighlightColor = (c: unknown): c is HighlightColor => typeof c === 'string' && c in HIGHLIGHT_COLORS;

/** Tags offered in the journal; any other word can be added as a custom tag. */
export const SUGGESTED_TAGS = ['prayer', 'reflection', 'readings', 'study', 'scripture', 'gratitude'];

/** "#Morning Prayer!" → "morning-prayer"; empty when nothing usable is left. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

/** Tags written inline in the text ("#gratitude"), merged with the chosen ones. */
export function tagsFrom(body: string, chosen: string[]): string[] {
  const inline = [...body.matchAll(/(^|\s)#([\p{L}\p{N}][\p{L}\p{N}-]*)/gu)].map((m) => normalizeTag(m[2]!));
  return [...new Set([...chosen.map(normalizeTag), ...inline])].filter(Boolean);
}

/** A random v4 UUID for a new note (ids are made on the phone, SPEC: Data model). */
export function newId(random: () => number = Math.random): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function makeNote(
  fields: { kind: NoteKind; targetType: NoteTarget; targetKey?: string } & Partial<Omit<Note, 'kind' | 'targetType'>>,
  now = new Date().toISOString(),
): Note {
  const id = fields.id ?? newId();
  return {
    highlightColor: null,
    body: null,
    prompt: null,
    tags: [],
    createdAt: now,
    ...fields,
    id,
    targetKey: fields.targetKey ?? id,
    updatedAt: now,
  };
}

/** The tags each kind of journal answer starts with. */
export function defaultTags(targetType: NoteTarget): string[] {
  return targetType === 'readings' ? ['readings'] : targetType === 'course_day' ? ['study'] : targetType === 'verse' ? ['scripture'] : [];
}

/** Journal entries, newest first, optionally only those with a tag; plus every tag in use. */
export function journalView(notes: Note[], tag: string | null): { entries: Note[]; tags: string[] } {
  const journal = notes.filter((n) => n.kind === 'journal' && (n.body ?? '').trim());
  const tags = [...new Set(journal.flatMap((n) => n.tags))].sort();
  const entries = journal
    .filter((n) => !tag || n.tags.includes(tag))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { entries, tags };
}
