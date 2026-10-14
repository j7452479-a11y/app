# Task 3 report — UUID publish concurrency token

## Outcome

Replaced numeric `store_pages.revision` with a `uuid not null default gen_random_uuid()` token. An invoker `BEFORE INSERT OR UPDATE` trigger always replaces caller input with a fresh UUID; on update it also sets `updated_at` in Postgres. The editor action treats the fetched token as a UUID string, checks the submitted preview canonically against persisted content, and publishes only the persisted snapshot if the conditional update still matches that exact token. A stale preview, malformed token, or token change before update returns the refresh-and-review message without changing the publication snapshot. Unpublish remains independent of the client token check and preserves both content snapshots.

The expected preview and token are not used for tenant selection or authorization. Server-resolved membership, role, and organization checks remain in place; database RLS remains the second boundary.

## Verification

- TDD red: `pnpm --filter @commerce-os/web test -- src/app/store/pages/actions.test.ts` failed the malformed-token test because the action did not validate the persisted revision as a UUID (10 passed, 1 failed).
- TDD green: the same focused action suite passed (11/11) after adding UUID validation; the cross-read/update race test compares exact UUID strings.
- Full web suite: `pnpm --filter @commerce-os/web test` — 29/29 tests passed across 4 files.
- Typecheck: `pnpm --filter @commerce-os/web typecheck` — passed.
- Whitespace validation: `git diff --check` — passed.
- pgTAP and migration execution were intentionally not run, and no live Supabase project was contacted or changed.

## Changed files

- `apps/web/src/app/store/pages/actions.ts`
- `apps/web/src/app/store/pages/actions.test.ts`
- `supabase/migrations/202610150001_store_pages_and_product_slugs.sql`
- `supabase/tests/storefront_pages.test.sql`
- `.superpowers/sdd/2026-10-15-multipage-client-storefront/task-3-brief.md`
- `.superpowers/sdd/2026-10-15-multipage-client-storefront/task-3-report.md`

The pgTAP assertions verify UUID column type, overwrite of a caller-provided sentinel on INSERT, and token rotation on UPDATE. They are added for later approved local verification but were not run; the migration remains unapplied.
