# Task 3 report — database-managed publish concurrency

## Outcome

Replaced timestamp-based publish compare-and-swap with a database-managed `store_pages.revision`. New rows start at revision `1`; an invoker `BEFORE UPDATE` trigger increments the revision and sets `updated_at` in Postgres. The editor action reads the persisted content and revision, checks the submitted preview canonically against persisted content, and publishes only the persisted snapshot if the conditional update still matches that revision. A stale preview or a revision change before update returns the refresh-and-review message without changing the publication snapshot. Unpublish remains independent of the client revision check and preserves both content snapshots.

The expected preview is not used for tenant selection or authorization. Server-resolved membership, role, and organization checks remain in place; database RLS remains the second boundary.

## Verification

- TDD red: `pnpm --filter @commerce-os/web test -- src/app/store/pages/actions.test.ts` failed the new read-to-update race case because the action returned no stale-revision error (9 passed, 1 failed).
- TDD green: the same focused action suite passed (10/10) after the revision filter was added.
- Full web suite: `pnpm --filter @commerce-os/web test` — 28/28 tests passed across 4 files.
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

The database revision assertions are added to pgTAP for a later approved local verification. The migration remains unapplied.
