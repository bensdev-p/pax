import { useTheme } from '@pax/tokens/react';
import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';

import { ContentStores } from './contentContext';
import { createContentLoader, staleContentFiles } from './contentDatabase';
import { detectFts, type ReadDb, type SqlParam } from './db';

export { useContent, useFathersPack, useLibrary } from './contentContext';

const CONTENT_DB = require('../../assets/content/content.db');
const BUNDLED = require('../../assets/content/content.json') as { contentVersion: string };

// Keep bundled content separate from both the legacy content.db and user.db. Each content
// version gets its own file so an OTA update never overwrites another runtime's open file.
const DATABASE_NAME = `content-${BUNDLED.contentVersion}.db`;
function contentDirectory(): Directory {
  const path = SQLite.defaultDatabaseDirectory;
  if (!path) throw new Error('SQLite database directory is unavailable.');
  return new Directory(path.includes('://') ? path : `file://${path}`, 'pax-content');
}

const loadDatabase = createContentLoader({
  version: BUNDLED.contentVersion,
  open: async () => {
    const dir = contentDirectory();
    dir.create({ intermediates: true, idempotent: true });
    return SQLite.openDatabaseAsync(DATABASE_NAME, { useNewConnection: true }, dir.uri);
  },
  replace: async () => {
    const asset = await Asset.fromModule(CONTENT_DB).downloadAsync();
    if (!asset.localUri) throw new Error('The bundled content database is unavailable.');
    const source = new File(asset.localUri);
    if (!source.exists || source.size === 0) throw new Error('The bundled content database is empty.');

    const dir = contentDirectory();
    const staged = new File(dir, `${DATABASE_NAME}.tmp`);
    try {
      if (staged.exists) staged.delete();
      await source.copy(staged);
      if (!staged.exists || staged.size !== source.size) throw new Error('The content database copy is incomplete.');
      // The loader has closed the connection. Touch only this version's content files.
      for (const suffix of ['', '-wal', '-shm', '-journal']) {
        const file = new File(dir, `${DATABASE_NAME}${suffix}`);
        if (file.exists) file.delete();
      }
      await staged.move(new File(dir, DATABASE_NAME));
    } finally {
      // move updates the File object's URI, so construct the staging path again.
      const leftover = new File(dir, `${DATABASE_NAME}.tmp`);
      if (leftover.exists) leftover.delete();
    }
  },
});

/** Deletes earlier content copies once the current one has checked out. Best effort. */
function removeStaleContent() {
  try {
    const dir = contentDirectory();
    const sqliteDir = dir.parentDirectory;
    const stale = staleContentFiles(
      dir.list().map((entry) => entry.name),
      sqliteDir.list().map((entry) => entry.name),
      DATABASE_NAME,
    );
    for (const name of stale.contentDir) new File(dir, name).delete();
    for (const name of stale.sqliteDir) new File(sqliteDir, name).delete();
  } catch (error) {
    console.warn('Pax could not remove old content files:', error);
  }
}

let loading: Promise<ReadDb> | null = null;
function loadContent(): Promise<ReadDb> {
  loading ??= loadDatabase().then(async (sqlite) => {
    removeStaleContent();
    const base = {
      all: <T,>(sql: string, params: SqlParam[] = []) => sqlite.getAllAsync<T>(sql, params),
      first: async <T,>(sql: string, params: SqlParam[] = []) => (await sqlite.getFirstAsync<T>(sql, params)) ?? null,
    };
    return { ...base, hasFts: await detectFts(base) };
  }).catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

export function ContentProvider({
  installedVersion,
  onInstalled,
  children,
}: {
  installedVersion: string | null;
  onInstalled: (version: string) => void;
  children: ReactNode;
}) {
  const t = useTheme();
  const [db, setDb] = useState<ReadDb | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [initialVersion] = useState(installedVersion);
  const installedCallback = useRef(onInstalled);
  useEffect(() => { installedCallback.current = onInstalled; }, [onInstalled]);

  useEffect(() => {
    let cancelled = false;
    void loadContent().then((content) => {
      if (cancelled) return;
      setDb(content);
      if (initialVersion !== BUNDLED.contentVersion) installedCallback.current(BUNDLED.contentVersion);
    }).catch((err: unknown) => {
      console.error('Pax content database failed to load:', err);
      if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
    });
    return () => { cancelled = true; };
  }, [attempt, initialVersion]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 16, backgroundColor: t.neutral.background }}>
        <Text variant="title" align="center">Pax couldn’t open its library.</Text>
        <Text align="center">Try again to restore the included content. Your progress is kept separately.</Text>
        <RaisedButton label="Try again" onPress={() => { setError(null); setAttempt((n) => n + 1); }} />
      </View>
    );
  }
  if (!db) return <ActivityIndicator style={{ flex: 1 }} color={t.accent.accent} />;
  return <ContentStores db={db} version={BUNDLED.contentVersion}>{children}</ContentStores>;
}
