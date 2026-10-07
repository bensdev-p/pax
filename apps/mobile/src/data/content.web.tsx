import { Asset } from 'expo-asset';
import { useEffect, useState, type ReactNode } from 'react';
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';

import { ContentStores } from './contentContext';
import type { ReadDb, SqlParam } from './db';

export { useContent, useFathersPack, useLibrary } from './contentContext';

// The web build loads the same content.db into memory with sql.js (SQLite compiled to
// WebAssembly; no FTS5, so search falls back to LIKE). The web version moves to Supabase later.
const CONTENT_DB = require('../../assets/content/content.db');
const SQL_WASM = require('sql.js/dist/sql-wasm-browser.wasm');
const BUNDLED = require('../../assets/content/content.json') as { contentVersion: string };

let loading: Promise<ReadDb> | null = null;

function loadContent(): Promise<ReadDb> {
  loading ??= (async () => {
    const [wasm, file] = [Asset.fromModule(SQL_WASM), Asset.fromModule(CONTENT_DB)];
    const SQL = await initSqlJs({ locateFile: () => wasm.uri });
    const bytes = new Uint8Array(await (await fetch(file.uri)).arrayBuffer());
    const db: initSqlJs.Database = new SQL.Database(bytes);
    const run = <T,>(sql: string, params: SqlParam[] = []): T[] => {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
        return rows;
      } finally {
        stmt.free();
      }
    };
    return {
      all: async <T,>(sql: string, params?: SqlParam[]) => run<T>(sql, params),
      first: async <T,>(sql: string, params?: SqlParam[]) => run<T>(sql, params)[0] ?? null,
      hasFts: false,
    };
  })();
  return loading;
}

export function ContentProvider({
  children,
}: {
  installedVersion: string | null;
  onInstalled: (version: string) => void;
  children: ReactNode;
}) {
  const [db, setDb] = useState<ReadDb | null>(null);
  useEffect(() => {
    void loadContent().then(setDb);
  }, []);
  if (!db) return null;
  return (
    <ContentStores db={db} version={BUNDLED.contentVersion}>
      {children}
    </ContentStores>
  );
}
