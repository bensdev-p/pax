-- Row-level security smoke test. Run against a local Supabase database after
-- `npx supabase db reset`:
--   psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" -f supabase/tests/rls_smoke.sql
-- Everything runs in a transaction that is rolled back.
begin;

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');
insert into public.profiles (user_id, ocia_stage) values
  ('11111111-1111-1111-1111-111111111111', 'catechumenate'),
  ('22222222-2222-2222-2222-222222222222', 'inquiry');
insert into public.daily_activity (user_id, local_date, did_prayer) values
  ('11111111-1111-1111-1111-111111111111', '2026-10-07', true);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'RLS: user 1 can see another user''s profile';
  end if;
  begin
    insert into public.profiles (user_id) values ('22222222-2222-2222-2222-222222222222');
    raise exception 'RLS: user 1 wrote a row for user 2';
  exception when insufficient_privilege then
    null; -- expected: new row violates row-level security policy
  end;
  perform public.delete_my_account();
end $$;

reset role;

do $$
begin
  if exists (select 1 from public.profiles where user_id = '11111111-1111-1111-1111-111111111111')
     or exists (select 1 from public.daily_activity) then
    raise exception 'delete_my_account left rows behind';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'delete_my_account removed another user''s data';
  end if;
  raise notice 'RLS smoke test passed';
end $$;

rollback;
