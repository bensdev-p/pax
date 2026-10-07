/**
 * Pax's Supabase project. The anon key is public by design: every user table has row-level
 * security, so the key alone can't read or write anyone's rows. Kept in code (not app.json
 * `extra`) so it is always bundled, on the phone and on the web.
 */
export const supabaseConfig = {
  url: 'https://wufwcvokotpdyvttcuga.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1Zndjdm9rb3RwZHl2dHRjdWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODEwNzUsImV4cCI6MjEwNjk1NzA3NX0.vD6xwA-QW94SKVkD8fxsg16lpnhifCVX7lBjMrfocfo',
};
