import { useCallback, useEffect, useState } from 'react';

import { userStore } from '@/data/userStore';
import type { MyPrayer } from '@/data/types';
import { mySlug } from '@/lib/myPrayers';

import { notes } from './notes';

/**
 * The user's own prayers (user.db `my_prayers`). Every save or delete tells the screens that
 * show them to read them again.
 */
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export const myPrayers = {
  async save(prayer: MyPrayer) {
    await userStore.saveMyPrayer(prayer);
    changed();
  },
  /** Deletes the prayer and its star, so "For you" doesn't point at a prayer that's gone. */
  async remove(id: string) {
    await userStore.deleteMyPrayer(id);
    const stars = await userStore.getNotes({ kind: 'favorite', targetType: 'prayer', targetKey: mySlug(id) });
    for (const star of stars) await notes.remove(star.id);
    changed();
  },
};

export function useMyPrayers(): { prayers: MyPrayer[]; loaded: boolean } {
  const [state, setState] = useState<{ prayers: MyPrayer[]; loaded: boolean }>({ prayers: [], loaded: false });
  const load = useCallback(() => {
    void userStore.getMyPrayers().then((prayers) => setState({ prayers, loaded: true }));
  }, []);
  useEffect(() => {
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [load]);
  return state;
}
