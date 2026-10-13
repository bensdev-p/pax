import { useEffect } from 'react';

import { useLibrary } from '@/data/content';
import { userStore } from '@/data/userStore';
import { renumbered } from '@/lib/notes';

import { useAppState } from './AppState';
import { notes } from './notes';

/** The verse numbering this build of Pax keys verses in (see Settings.verseNumbering). */
export const VERSE_NUMBERING = 2;

let running: Promise<void> | null = null;

/**
 * Moves highlights, bookmarks and notes on New Testament verses whose key changed when the
 * Douay's own verse divisions were mapped (John 6:69 is now John.6.68), once per device.
 */
export function useVerseRenumbering() {
  const { ready, settings, updateSettings } = useAppState();
  const library = useLibrary();
  const due = ready && settings.verseNumbering < VERSE_NUMBERING;

  useEffect(() => {
    if (!due || running) return;
    running = (async () => {
      const moved = renumbered(await userStore.getNotes({ targetType: 'verse' }), await library.verseRenames());
      for (const note of moved) await notes.save(note);
      await updateSettings({ verseNumbering: VERSE_NUMBERING });
    })()
      .catch((err) => console.error('Pax could not move verse notes', err))
      .finally(() => {
        running = null;
      });
  }, [due, library, updateSettings]);
}
