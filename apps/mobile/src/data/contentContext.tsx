import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAppState } from '@/state/AppState';

import { createContentStore } from './contentStore';
import type { ReadDb } from './db';
import { downloadPack, fetchManifest, openPack, removePack, type PackState } from './fathersPack';
import { createLibrary, type LibraryStore } from './library';
import type { ContentStore } from './types';

interface ContentContextValue {
  content: ContentStore;
  library: LibraryStore;
  pack: PackState & { download(): Promise<void>; remove(): Promise<void> };
}

const ContentContext = createContext<ContentContextValue | null>(null);

/** Builds the stores over an open content.db and manages the optional Fathers pack. */
export function ContentStores({ db, version, children }: { db: ReadDb; version: string; children: ReactNode }) {
  const { settings, updateSettings } = useAppState();
  const packDbs = useRef<ReadDb[]>([]);
  const [pack, setPack] = useState<PackState>({
    status: 'none',
    progress: 0,
    totalBytes: 0,
    error: null,
    install: settings.fathersPack,
  });

  // Reopen an installed pack on launch.
  useEffect(() => {
    const install = settings.fathersPack;
    if (!install || packDbs.current.length) return;
    void openPack(install).then((dbs) => {
      if (dbs) {
        packDbs.current = dbs;
        setPack((p) => ({ ...p, status: 'ready', install }));
      } else {
        void updateSettings({ fathersPack: null });
      }
    });
  }, [settings.fathersPack, updateSettings]);

  const download = useCallback(async () => {
    setPack((p) => ({ ...p, status: 'downloading', progress: 0, error: null }));
    try {
      const manifest = await fetchManifest();
      const totalBytes = manifest.parts.reduce((n, p) => n + p.bytes, 0);
      setPack((p) => ({ ...p, totalBytes }));
      const install = await downloadPack(manifest, (progress) => setPack((p) => ({ ...p, progress })));
      const dbs = await openPack(install);
      if (!dbs) throw new Error('The downloaded files could not be opened.');
      packDbs.current = dbs;
      await updateSettings({ fathersPack: install });
      setPack((p) => ({ ...p, status: 'ready', progress: 1, install }));
    } catch (e) {
      setPack((p) => ({ ...p, status: 'error', error: e instanceof Error ? e.message : String(e) }));
    }
  }, [updateSettings]);

  const remove = useCallback(async () => {
    const install = settings.fathersPack;
    packDbs.current = [];
    if (install) removePack(install);
    await updateSettings({ fathersPack: null });
    setPack({ status: 'none', progress: 0, totalBytes: 0, error: null, install: null });
  }, [settings.fathersPack, updateSettings]);

  const value = useMemo<ContentContextValue>(
    () => ({
      content: createContentStore(db, version),
      // The pack status is part of the key so screens re-query when it changes.
      library: createLibrary(db, () => (pack.status === 'ready' ? packDbs.current : [])),
      pack: { ...pack, download, remove },
    }),
    [db, version, pack, download, remove],
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

function useContentContext(): ContentContextValue {
  const value = useContext(ContentContext);
  if (!value) throw new Error('Content hooks must be used inside <ContentProvider>');
  return value;
}

export const useContent = () => useContentContext().content;
export const useLibrary = () => useContentContext().library;
export const useFathersPack = () => useContentContext().pack;
