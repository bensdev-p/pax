import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';

import { supabaseConfig } from './supabaseConfig';

/**
 * Supabase client (SPEC: Backend). Phase 1 only connects: nobody signs in and no user data is
 * sent. Anonymous sign-in and sync arrive in Phase 3, after the user agrees to sync.
 * Created on first use, so a configuration problem can never break a screen at import time.
 * The session, once there is one, is kept in expo-sqlite's key-value store on the phone.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const created = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      storage: Storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  // Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void created.auth.startAutoRefresh();
    else void created.auth.stopAutoRefresh();
  });
  client = created;
  return created;
}
