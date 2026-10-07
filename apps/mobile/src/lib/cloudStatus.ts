import { supabase } from './supabase';

export type CloudStatus = 'checking' | 'ready' | 'schema-missing' | 'offline';

/**
 * Asks Supabase whether Pax's tables exist. Sends no user data: it is an anonymous HEAD request
 * on `profiles`, which row-level security answers with zero rows.
 */
export async function checkCloud(): Promise<CloudStatus> {
  try {
    const { error } = await supabase.from('profiles').select('user_id', { head: true, count: 'exact' });
    if (!error) return 'ready';
    // PGRST205 / 42P01: the table isn't there, so the migrations haven't been applied.
    if (error.code === 'PGRST205' || error.code === '42P01' || /does not exist|schema cache/i.test(error.message)) {
      return 'schema-missing';
    }
    // Permission denied still proves the table exists.
    if (error.code === '42501') return 'ready';
    return 'offline';
  } catch {
    return 'offline';
  }
}
