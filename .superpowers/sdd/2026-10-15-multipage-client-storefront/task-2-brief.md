### Task 2: Persist merchant pages and product slugs securely

**Files:**
- Create: `supabase/config.toml` (minimal local CLI configuration only if needed for database tests; no project secrets)
- Create: `supabase/migrations/202610150001_store_pages_and_product_slugs.sql`
- Test: `supabase/tests/storefront_pages.test.sql`

**Interfaces:**
- `public.store_pages`: one row per `(organization_id, page_type)`, editable draft `content jsonb`, nullable `published_content jsonb` snapshot, nullable `published_at`, timestamps, constrained page type, tenant foreign key. Public clients read only `published_content`; editing a published page must leave its current snapshot unchanged until explicit republish.
- Allowed page types: `about`, `contact`, `faq`, `shipping_returns`.
- `public.products.slug`: non-null, unique within organization, and a single lowercase URL-safe route segment matching `^[a-z0-9]+(-[a-z0-9]+)*$` with a maximum length of 2048 characters. Backfill every existing row deterministically as a readable NFKD-normalized name plus the complete lowercase alphanumeric UUID; using the full UUID guarantees uniqueness even when UUID prefixes collide. New products get the same form via a database trigger when slug is omitted/blank; blank supplied values are generated while invalid nonblank values fail the constraint. Product-name updates must not mutate an already assigned slug/URL.
- RLS and grants: anon may select only published `store_pages` whose parent store is published and currently available; authenticated members may read their organization's draft/published pages; only owner/admin/manager may insert/update/delete pages while their workspace is unlocked. No anonymous writes. Use `TO anon`/`TO authenticated`; do not authorize from user-editable metadata. Keep existing products' policies and store availability behavior intact.

## Global constraints

- Database changes are forward-only, backward-compatible, and protected by RLS.
- Existing stores remain usable without new page records.
- Public reads never expose draft pages or cross-tenant products.
- Do not apply this migration to a remote/production Supabase project as part of this task.
- The existing branch contains only a local migration set; there is no approved project link or production migration authority in this task.

- [ ] **Step 1: Write pgTAP tests for** page table and constraints, unique per-tenant product slugs, slug immutability after rename, anonymous visibility of published pages only, owner/admin/manager write access when unlocked, denial for staff/other-tenant members, and denial of anonymous writes.
- [ ] **Step 2: Check CLI availability/version and run `supabase --help` plus `supabase test db --help` before CLI use. If CLI and local Docker runtime are available, initialize only the minimal local project config and run the red test against the pre-migration database. If unavailable, record the exact limitation and continue with migration/static checks; do not install system tooling or contact a live database.**
- [ ] **Step 3: Create the migration using `supabase migration new store_pages_and_product_slugs` when the CLI is available; otherwise follow the approved migration file path in the implementation plan. Implement the table, product slug backfill/trigger/indexes, grants, RLS, and policies.**
- [ ] **Step 4: Run the local Supabase tests and confirm the RLS/constraint tests pass; if the local stack is unavailable, document this as unverified rather than claiming a pass.**
- [ ] **Step 5: Inspect the migration for least privilege, both `USING` and `WITH CHECK` on updates, indexed policy predicates, no elevated security-definer helper, and no changes to order/payment/store-availability logic.**
