import type { ReadDb } from './db';
import type { FathersPackInstall } from './types';

// The full Fathers library is a phone download. On the web it will come from Supabase.
export const PACK_BASE_URL = '';
export interface PackManifest {
  version: string;
  passages: number;
  parts: { file: string; bytes: number }[];
}
export type PackStatus = 'none' | 'downloading' | 'ready' | 'error';
export interface PackState {
  status: PackStatus;
  progress: number;
  totalBytes: number;
  error: string | null;
  install: FathersPackInstall | null;
}
export async function fetchManifest(): Promise<PackManifest> {
  throw new Error('The full Fathers library is available in the phone app.');
}
export async function openPack(_install: FathersPackInstall): Promise<ReadDb[] | null> {
  return null;
}
export async function downloadPack(_m: PackManifest, _p: (f: number) => void): Promise<FathersPackInstall> {
  throw new Error('The full Fathers library is available in the phone app.');
}
export function removePack(_install: FathersPackInstall) {}
export const PACK_SUPPORTED = false;
