# Task 2 review follow-up — deterministic product slug collisions

Status: implemented and committed with the Task 2 review follow-up.

## Review finding and resolution

The original eight-character UUID suffix could collide for products in the same organization when their names and first eight UUID characters matched. Since the migration adds a per-organization unique constraint, that case could abort the backfill.

Product slugs now use the normalized readable name (or `product`) followed by the full lowercase alphanumeric UUID. The UUID primary key makes this deterministic and unique independently of row ordering. The database helper is shared by the backfill and insert trigger; the trigger still preserves an assigned slug on updates. The Task 1 TypeScript helper now emits the same format. This replaces the prior eight-character suffix convention.

## Coverage and verification

- Added a targeted TypeScript regression case for two same-name products whose UUIDs share the old eight-character prefix. The test failed against the old helper, then passed after the change. Targeted Vitest result: 4 tests passed.
- Added pgTAP cases that insert two colliding-prefix products through the database trigger and check distinct full-UUID slugs.
- Added a legacy-row fixture that applies the same helper used by the migration backfill, then applies the per-organization unique constraint to duplicate-name/colliding-prefix rows. This exercises deterministic backfill behavior without a pre-migration database.
- `git diff --check` passed.
- Supabase CLI and Docker remain unavailable, so pgTAP and PostgreSQL migration execution were not run. No database was contacted or modified; do not treat pgTAP as passed.

## Limitation

The legacy fixture covers the backfill helper and uniqueness behavior, but it cannot execute the actual migration against an old database in this environment. Full migration execution remains unverified until a local Supabase stack is available.
