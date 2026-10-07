# supabase

Schema for Pax's cloud data. Phase 1 defines the tables only: the app does not sign in or sync
yet, so nothing is stored in Supabase today.

- `migrations/` – Postgres schema with row-level security on every user table.
- `tests/rls_smoke.sql` – checks that a user sees only their own rows and that account deletion
  leaves nothing behind.
- `delete_my_account()` – removes the signed-in user and, by cascade, every row they own.

Run locally with the Supabase CLI (`npx supabase start`, then `npx supabase db reset`).
When this schema changes, update `PRIVACY.md` in the same commit.
