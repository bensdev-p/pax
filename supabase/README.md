# supabase

Schema for Pax's cloud data. Project: `wufwcvokotpdyvttcuga` (URL and anon key in
`apps/mobile/app.json` under `extra.supabase`). Phase 1 defines the tables only: the app does not
sign in or sync yet, so nothing is stored in Supabase today. Profile → Cloud shows whether the app
can reach the project and whether the tables exist.

## Applying the schema

Either from a computer with the Supabase CLI:

```sh
npx supabase login
npx supabase link --project-ref wufwcvokotpdyvttcuga
npx supabase db push
```

Or in the dashboard: SQL Editor → New query, paste each file in `migrations/` in name order, and
run it. Then run `tests/rls_smoke.sql` the same way; it should end with "RLS smoke test passed"
and leaves no data behind.

- `migrations/` – Postgres schema with row-level security on every user table.
- `tests/rls_smoke.sql` – checks that a user sees only their own rows and that account deletion
  leaves nothing behind.
- `delete_my_account()` – removes the signed-in user and, by cascade, every row they own.

Run locally with the Supabase CLI (`npx supabase start`, then `npx supabase db reset`).
When this schema changes, update `PRIVACY.md` in the same commit.
