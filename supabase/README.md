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

## Fathers library pack (Storage)

The full Church Fathers library is downloaded by the app from a public Storage bucket, then used
offline. To publish it:

1. On a computer with Python 3.10+, from the repo root:
   `python3 pipeline/fetch_sources.py && python3 pipeline/fathers.py pack 1`
2. In the dashboard: **Storage → New bucket**, name `packs`, and turn on **Public bucket**.
3. Open `packs`, create a folder `fathers`, and upload everything in
   `pipeline/build/fathers-pack/`: `manifest.json` and the four `fathers-1-*.db` parts (each
   under the free plan's 50 MB limit).
4. In Pax: Library → Church Fathers → Download.

The app reads `https://wufwcvokotpdyvttcuga.supabase.co/storage/v1/object/public/packs/fathers/manifest.json`.
A new pack version (`fathers.py pack 2`) uses new file names, so installed copies keep working.
To switch a phone to the new version, remove the download in the app and download it again.
