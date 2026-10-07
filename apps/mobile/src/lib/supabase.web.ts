import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabaseConfig } from './supabaseConfig';

let client: SupabaseClient | null = null;

// The browser keeps the session in localStorage (supabase-js default).
export function getSupabase(): SupabaseClient {
  client ??= createClient(supabaseConfig.url, supabaseConfig.anonKey);
  return client;
}
