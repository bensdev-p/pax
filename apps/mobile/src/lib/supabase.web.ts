import { createClient } from '@supabase/supabase-js';

import { supabaseConfig } from './supabaseConfig';

// The browser keeps the session in localStorage (supabase-js default).
export const supabase = createClient(supabaseConfig.url ?? '', supabaseConfig.anonKey ?? '');
