-- Pax: user tables in Supabase (SPEC: Data model). Phase 1 creates the schema only; the app
-- does not sign in or sync yet. Every table has row-level security, and every policy limits a
-- user to their own rows. Content tables for the web arrive with the pipeline's Postgres publish.

-- profiles ------------------------------------------------------------------
create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  -- OCIA stage is religious information (special-category data under GDPR art. 9).
  -- Only the user can read it; it is never shared with other users or used for analytics.
  ocia_stage   text check (ocia_stage in (
                 'just_curious', 'inquiry', 'catechumenate',
                 'purification_and_enlightenment', 'newly_received', 'going_deeper')),
  timezone     text,
  theme_lock   text check (theme_lock in ('green', 'violet', 'rose', 'white', 'red', 'black')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- synced from user.db -------------------------------------------------------
create table public.daily_activity (
  user_id        uuid not null references auth.users (id) on delete cascade,
  local_date     date not null,
  did_lesson     boolean not null default false,
  did_readings   boolean not null default false,
  did_prayer     boolean not null default false,
  xp             integer not null default 0 check (xp >= 0),
  used_grace_day boolean not null default false,
  updated_at     timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table public.lesson_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  lesson_slug  text not null,
  completed_at timestamptz not null,
  score        real,
  xp           integer not null default 0 check (xp >= 0),
  primary key (user_id, lesson_slug)
);

create table public.review_cards (
  user_id       uuid not null references auth.users (id) on delete cascade,
  question_slug text not null,
  ease          real not null default 2.5,
  interval_days integer not null default 0,
  due_at        timestamptz not null,
  primary key (user_id, question_slug)
);

create table public.streaks (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  current          integer not null default 0,
  longest          integer not null default 0,
  last_active_date date,
  grace_days_left  integer not null default 2
);

create table public.notes (
  user_id         uuid not null references auth.users (id) on delete cascade,
  id              uuid not null,                -- generated on the phone
  target_type     text not null check (target_type in ('verse', 'ccc', 'father', 'prayer', 'saint')),
  target_key      text not null,                -- OSIS ref, CCC number, slug or romcal key
  highlight_color text,
  body            text,
  updated_at      timestamptz not null default now(),
  primary key (user_id, id)
);

-- Supabase only -------------------------------------------------------------
create table public.devices (
  user_id     uuid not null references auth.users (id) on delete cascade,
  platform    text not null check (platform in ('ios', 'android', 'web')),
  push_token  text not null,
  app_version text,
  last_seen   timestamptz not null default now(),
  primary key (user_id, push_token)
);

create table public.notification_prefs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in (
               'daily_reminder', 'streak_at_risk', 'angelus', 'novena_day', 'feast_quest', 'come_back')),
  enabled    boolean not null default false,
  local_time time,
  primary key (user_id, type)
);

-- Row-level security: each user sees and changes only their own rows. -------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'daily_activity', 'lesson_progress', 'review_cards',
    'streaks', 'notes', 'devices', 'notification_prefs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Account deletion (SPEC: Data model rule 5; required by Apple). Deleting the auth user
-- cascades to every table above, so no Pax row for the user survives.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
