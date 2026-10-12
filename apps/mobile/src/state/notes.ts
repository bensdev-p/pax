import { useCallback, useEffect, useState } from 'react';

import { userStore } from '@/data/userStore';
import type { Note, NoteQuery } from '@/data/types';

/**
 * Journal entries, highlights, bookmarks and favorites (user.db `notes`). Every save or delete
 * tells the screens that show notes to read them again.
 */
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export const notes = {
  async save(note: Note) {
    await userStore.saveNote({ ...note, updatedAt: new Date().toISOString() });
    changed();
  },
  async remove(id: string) {
    await userStore.deleteNote(id);
    changed();
  },
};

/** Notes matching the query, kept current as notes change anywhere in the app. */
export function useNotes(query: NoteQuery): { notes: Note[]; loaded: boolean } {
  const { kind, targetType, targetKey } = query;
  const [state, setState] = useState<{ notes: Note[]; loaded: boolean }>({ notes: [], loaded: false });
  const load = useCallback(() => {
    void userStore.getNotes({ kind, targetType, targetKey }).then((n) => setState({ notes: n, loaded: true }));
  }, [kind, targetType, targetKey]);
  useEffect(() => {
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [load]);
  return state;
}
