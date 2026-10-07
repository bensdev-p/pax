import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';

import { supabaseConfig } from './supabaseConfig';

/**
 * Supabase client (SPEC: Backend). Phase 1 only connects: nobody signs in and no user data is
 * sent. Anonymous sign-in and sync arrive in Phase 3, after the user agrees to sync.
 * The session, once there is one, is kept in expo-sqlite's key-value store on the phone.
 */
export const supabase = createClient(supabaseConfig.url ?? '', supabaseConfig.anonKey ?? '', {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
