import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ContentStore, Prayer, RosaryMystery } from './types';

// Built by pipeline/build_content.py. Copied into the app's SQLite folder on first launch and
// whenever a new build ships a different content version.
const CONTENT_DB = require('../../assets/content/content.db');
const BUNDLED = require('../../assets/content/content.json') as { contentVersion: string };

const ContentContext = createContext<ContentStore | null>(null);

export function ContentProvider({
  installedVersion,
  onInstalled,
  children,
}: {
  installedVersion: string | null;
  onInstalled: (version: string) => void;
  children: ReactNode;
}) {
  // Decided once per launch so the provider never reopens the database mid-session.
  const [forceOverwrite] = useState(() => installedVersion !== BUNDLED.contentVersion);
  return (
    <SQLiteProvider
      databaseName="content.db"
      assetSource={{ assetId: CONTENT_DB, forceOverwrite }}
      onInit={async (db) => {
        const meta = await db.getFirstAsync<{ content_version: string }>(
          'SELECT content_version FROM content_meta',
        );
        if (meta && meta.content_version !== installedVersion) onInstalled(meta.content_version);
      }}>
      <SqliteContent>{children}</SqliteContent>
    </SQLiteProvider>
  );
}

function SqliteContent({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const store = useMemo<ContentStore>(
    () => ({
      version: BUNDLED.contentVersion,
      prayers: () => db.getAllAsync<Prayer>('SELECT * FROM prayers ORDER BY sort_order'),
      prayer: (slug) => db.getFirstAsync<Prayer>('SELECT * FROM prayers WHERE slug = ?', slug),
      mysteries: (set) =>
        db.getAllAsync<RosaryMystery>(
          'SELECT * FROM rosary_mysteries WHERE mystery_set = ? ORDER BY number',
          set,
        ),
    }),
    [db],
  );
  return <ContentContext.Provider value={store}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentStore {
  const store = useContext(ContentContext);
  if (!store) throw new Error('useContent must be used inside <ContentProvider>');
  return store;
}
