-- Notes become the journal, highlights, bookmarks and favorites (Phase 3), matching user.db
-- migration 5. Journal entries are private: they sync only once the user turns sync on.
alter table public.notes drop constraint notes_target_type_check;
alter table public.notes add constraint notes_target_type_check check (target_type in (
  'verse', 'ccc', 'father', 'prayer', 'saint', 'devotion', 'readings', 'course_day', 'entry'));

alter table public.notes
  add column kind       text not null default 'journal' check (kind in ('journal', 'highlight', 'bookmark', 'favorite')),
  add column prompt     text,                          -- Pax's question, kept with the answer
  add column tags       text[] not null default '{}',
  add column created_at timestamptz not null default now();

create index notes_target on public.notes (user_id, target_type, target_key);
