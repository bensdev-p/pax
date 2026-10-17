import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createContentLoader, staleContentFiles, validateContentDatabase } from '../src/data/contentDatabase';

const bundledPath = new URL('../assets/content/content.db', import.meta.url);
const version = new DatabaseSync(bundledPath, { readOnly: true });
const bundledVersion = (version.prepare('SELECT content_version FROM content_meta').get() as { content_version: string }).content_version;
version.close();
const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  vi.restoreAllMocks();
});

function connection(path: string | URL) {
  const db = new DatabaseSync(path);
  let closed = false;
  const close = () => { if (!closed) { db.close(); closed = true; } };
  cleanups.push(close);
  return {
    getAllAsync: async <T,>(sql: string): Promise<T[]> => db.prepare(sql).all() as T[],
    getFirstAsync: async <T,>(sql: string): Promise<T | null> => (db.prepare(sql).get() as T | undefined) ?? null,
    closeAsync: vi.fn(async () => close()),
    exec: (sql: string) => db.exec(sql),
  };
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'pax-content-test-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'content.db');
  const connections: ReturnType<typeof connection>[] = [];
  const open = vi.fn(async () => {
    const db = connection(path);
    connections.push(db);
    return db;
  });
  const replace = vi.fn(async () => {
    expect(connections.every((db) => db.closeAsync.mock.calls.length > 0)).toBe(true);
    copyFileSync(bundledPath, path);
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  return { path, open, replace, connections, load: createContentLoader({ version: bundledVersion, open, replace }) };
}

describe('native content database startup', () => {
  it('accepts the real bundled database and rejects an empty database with the reported missing-table failure', async () => {
    await expect(validateContentDatabase(connection(bundledPath), bundledVersion)).resolves.toBeUndefined();
    await expect(validateContentDatabase(connection(':memory:'), bundledVersion)).rejects.toThrow('content_meta');
  });

  it('installs and validates complete bundled content on a fresh launch', async () => {
    const f = fixture();
    const db = await f.load();
    expect(f.replace).toHaveBeenCalledOnce();
    expect(await db.getFirstAsync('SELECT COUNT(*) AS count FROM bible_verses')).toMatchObject({ count: expect.any(Number) });
    await expect(validateContentDatabase(db, bundledVersion)).resolves.toBeUndefined();
  });

  it('reuses one connection for concurrent callers and later mounts without copying again', async () => {
    const f = fixture();
    copyFileSync(bundledPath, f.path);
    const first = f.load();
    expect(f.load()).toBe(first);
    const db = await first;
    expect(await f.load()).toBe(db);
    expect(f.open).toHaveBeenCalledOnce();
    expect(f.replace).not.toHaveBeenCalled();
  });

  it('repairs an existing empty database after closing its connection', async () => {
    const f = fixture();
    const empty = new DatabaseSync(f.path);
    empty.close();
    await f.load();
    expect(f.connections[0].closeAsync).toHaveBeenCalledOnce();
    expect(f.replace).toHaveBeenCalledOnce();
  });

  it('restores an outdated version even if stored app settings would say it is current', async () => {
    const f = fixture();
    copyFileSync(bundledPath, f.path);
    const old = new DatabaseSync(f.path);
    old.exec("UPDATE content_meta SET content_version = 'old'");
    old.close();
    const db = await f.load();
    await expect(validateContentDatabase(db, bundledVersion)).resolves.toBeUndefined();
    expect(f.replace).toHaveBeenCalledOnce();
  });

  it('retries a failed copy instead of caching the rejected promise', async () => {
    const f = fixture();
    f.replace.mockRejectedValueOnce(new Error('disk full'));
    await expect(f.load()).rejects.toThrow('disk full');
    await expect(f.load()).resolves.toBeDefined();
    expect(f.replace).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid bundled copy, closes it, and allows another attempt', async () => {
    const f = fixture();
    f.replace.mockImplementationOnce(async () => {});
    await expect(f.load()).rejects.toThrow('needs to be restored');
    expect(f.connections.every((db) => db.closeAsync.mock.calls.length > 0)).toBe(true);
    await expect(f.load()).resolves.toBeDefined();
  });

  it('does not replace a database if its connection could not be closed', async () => {
    const db = connection(':memory:');
    db.closeAsync.mockRejectedValueOnce(new Error('close failed'));
    const replace = vi.fn();
    const load = createContentLoader({ version: bundledVersion, open: async () => db, replace });
    await expect(load()).rejects.toThrow('close failed');
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('old content files', () => {
  it('lists other content versions and the legacy content.db, never the current file or user.db', () => {
    const stale = staleContentFiles(
      ['content-2026.10.15.db', 'content-2026.10.15.db-wal', 'content-2026.10.16.db', 'content-2026.10.16.db-shm', 'content-2026.10.16.db.tmp', 'notes.txt'],
      ['content.db', 'content.db-journal', 'user.db', 'user.db-wal', 'pax-content'],
      'content-2026.10.16.db',
    );
    expect(stale.contentDir).toEqual(['content-2026.10.15.db', 'content-2026.10.15.db-wal']);
    expect(stale.sqliteDir).toEqual(['content.db', 'content.db-journal']);
  });
});
