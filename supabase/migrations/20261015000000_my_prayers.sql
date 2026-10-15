-- Prayers a user adds to their own prayer book (Phase 4), matching user.db migration 6. Private:
-- they sync only once the user turns sync on, and account deletion removes them with the rest.
create table public.my_prayers (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         uuid not null,                -- generated on the phone
  title      text not null,
  author     text,                         -- "Saint Augustine", if given
  category   text not null check (category in ('essentials', 'daily', 'marian', 'eucharist', 'saints', 'departed', 'rosary')),
  text       text not null,
  latin_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.my_prayers enable row level security;
alter table public.my_prayers force row level security;
create policy "own rows" on public.my_prayers for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
