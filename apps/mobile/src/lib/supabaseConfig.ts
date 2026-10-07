import Constants from 'expo-constants';

/**
 * Project URL and anon key from app.json `extra.supabase`. The anon key is public by design:
 * every user table has row-level security, so the key alone reads and writes nothing.
 */
export const supabaseConfig = (Constants.expoConfig?.extra?.supabase ?? {}) as { url?: string; anonKey?: string };
