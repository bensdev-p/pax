import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { ContentStores } from './contentContext';
import { detectFts, type ReadDb, type SqlParam } from './db';

export { useContent, useFathersPack, useLibrary } from './contentContext';

// Built by pipeline/build_content.py. Copied into the app's SQLite folder on first launch and
// whenever a new build ships a different content version.
const CONTENT_DB = require('../../assets/content/content.db');
const BUNDLED = require('../../assets/content/content.json') as { contentVersion: string };

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
        const meta = await db.getFirstAsync<{ content_version: string }>('SELECT content_version FROM content_meta');
        if (meta && meta.content_version !== installedVersion) onInstalled(meta.content_version);
      }}>
      <NativeContent>{children}</NativeContent>
    </SQLiteProvider>
  );
}

function NativeContent({ children }: { children: ReactNode }) {
  const sqlite = useSQLiteContext();
  const base = useMemo(
    () => ({
      all: <T,>(sql: string, params: SqlParam[] = []) => sqlite.getAllAsync<T>(sql, params),
      first: async <T,>(sql: string, params: SqlParam[] = []) => (await sqlite.getFirstAsync<T>(sql, params)) ?? null,
    }),
    [sqlite],
  );
  const [db, setDb] = useState<ReadDb | null>(null);
  useEffect(() => {
    void detectFts(base).then((hasFts) => setDb({ ...base, hasFts }));
  }, [base]);
  if (!db) return null;
  return (
    <ContentStores db={db} version={BUNDLED.contentVersion}>
      {children}
    </ContentStores>
  );
}
