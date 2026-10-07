import { Directory, DownloadTask, File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { supabaseConfig } from '@/lib/supabaseConfig';

import type { ReadDb, SqlParam } from './db';
import type { FathersPackInstall } from './types';

/**
 * The full Church Fathers library: SQLite parts (each under Supabase Storage's 50 MB limit)
 * downloaded once into the app's SQLite folder, then opened read-only alongside content.db.
 * Hosted in the public `packs` bucket: packs/fathers/manifest.json plus the part files.
 */
export const PACK_BASE_URL = `${supabaseConfig.url}/storage/v1/object/public/packs/fathers`;

export interface PackManifest {
  version: string;
  passages: number;
  parts: { file: string; bytes: number }[];
}

export type PackStatus = 'none' | 'downloading' | 'ready' | 'error';

export interface PackState {
  status: PackStatus;
  /** 0–1 while downloading. */
  progress: number;
  totalBytes: number;
  error: string | null;
  install: FathersPackInstall | null;
}

const sqliteDir = () => {
  const dir = SQLite.defaultDatabaseDirectory as string;
  return new Directory(dir.includes('://') ? dir : `file://${dir}`);
};

function toReadDb(db: SQLite.SQLiteDatabase): ReadDb {
  return {
    all: <T,>(sql: string, params: SqlParam[] = []) => db.getAllAsync<T>(sql, params),
    first: async <T,>(sql: string, params: SqlParam[] = []) => (await db.getFirstAsync<T>(sql, params)) ?? null,
    hasFts: false,
  };
}

export async function fetchManifest(): Promise<PackManifest> {
  const res = await fetch(`${PACK_BASE_URL}/manifest.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`The Fathers library isn't available right now (HTTP ${res.status}).`);
  return (await res.json()) as PackManifest;
}

/** Opens an installed pack; returns null if any part is missing. */
export async function openPack(install: FathersPackInstall): Promise<ReadDb[] | null> {
  const dir = sqliteDir();
  if (!install.files.every((f) => new File(dir, f).exists)) return null;
  const dbs = await Promise.all(install.files.map((f) => SQLite.openDatabaseAsync(f, { useNewConnection: true })));
  return dbs.map(toReadDb);
}

export async function downloadPack(
  manifest: PackManifest,
  onProgress: (fraction: number) => void,
): Promise<FathersPackInstall> {
  const dir = sqliteDir();
  const total = manifest.parts.reduce((n, p) => n + p.bytes, 0);
  let done = 0;
  for (const part of manifest.parts) {
    const target = new File(dir, part.file);
    if (target.exists && target.size === part.bytes) {
      done += part.bytes;
      onProgress(done / total);
      continue;
    }
    if (target.exists) target.delete();
    const task = new DownloadTask(`${PACK_BASE_URL}/${part.file}`, target, {
      onProgress: ({ bytesWritten }) => onProgress((done + bytesWritten) / total),
    });
    const file = await task.downloadAsync();
    if (!file) throw new Error('The download was paused.');
    done += part.bytes;
    onProgress(done / total);
  }
  return { version: manifest.version, files: manifest.parts.map((p) => p.file) };
}

export function removePack(install: FathersPackInstall) {
  const dir = sqliteDir();
  for (const f of install.files) {
    const file = new File(dir, f);
    if (file.exists) file.delete();
  }
}

export const PACK_SUPPORTED = true;
