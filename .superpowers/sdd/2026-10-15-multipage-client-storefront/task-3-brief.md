### Task 3: Build the guided Store pages editor

**Files:**
- Create: `apps/web/src/app/store/pages/page.tsx`
- Create: `apps/web/src/app/store/pages/actions.ts`
- Create: `apps/web/src/app/_components/store-pages-editor.tsx`
- Modify: `apps/web/src/app/_components/app-shell.tsx` (add Store pages navigation)
- Modify: `apps/web/src/app/features.css` (editor layout, checklist, preview states)
- Modify: `supabase/migrations/202610150001_store_pages_and_product_slugs.sql` (database-managed store-page revision)
- Modify: `supabase/tests/storefront_pages.test.sql` (revision default, constraint, and increment coverage)
- Test: `apps/web/src/app/store/pages/actions.test.ts`

**Interfaces:**
- `saveStorePage(formData): Promise<ActionState>` validates `page_type` and JSON content with `parseStorePageContent`, resolves the signed-in user's organization server-side, then inserts/updates only that tenant's draft `content`. It must leave existing `published_content` and `published_at` unchanged.
- `setStorePagePublished(formData): Promise<ActionState>` resolves the tenant/page server-side. Publish parses the previewed draft from the form, compares its canonical form with persisted `content`, then conditionally updates using the row's database-managed `revision`. If either comparison detects a concurrent save, ask the merchant to refresh and review. Publish validates readiness against persisted `content`, copies only that persisted content to `published_content`, and sets `published_at`. Unpublish sets `published_at` null but preserves both content snapshots. Do not accept organization IDs, published JSON, or auth state from the browser; the expected preview is a concurrency check only, never authorization.
- `store_pages.revision` is a positive `bigint` initialized to `1`; an invoker `BEFORE UPDATE` trigger increments it and updates `updated_at` server-side. Actions must not use client-generated timestamps for optimistic concurrency.
- `StorePagesEditor` receives page rows, store name, and selected template; renders bounded inputs for the exact page shapes in Task 1; allows choosing About, Contact, FAQ, Shipping & Returns; displays draft/published status and readiness checklist; provides Save draft, Publish/Unpublish, and desktop/mobile template preview.

## Global constraints

- Do not invent contact details, delivery promises, return terms, business history, or other factual claims.
- Existing stores remain live while pages are drafted or edited; draft changes do not overwrite a published snapshot.
- Merchant writes are tenant-scoped and RLS remains a second authorization boundary.
- Database access is gated by existing workspace entitlement and owner/admin/manager roles.
- Do not change checkout, payment, messaging, order tracking, recommendations, or other plan behavior in this task.

- [ ] **Step 1: Write failing tests** for unauthenticated save/publish, invalid content, cross-tenant IDs, incomplete publish, valid draft save, publish-copy semantics, editing a published page without changing its live snapshot, unpublish preserving content, and rejecting a revision change between read and conditional publish.
- [ ] **Step 2: Run `pnpm --filter @commerce-os/web test -- src/app/store/pages/actions.test.ts` and confirm failure before implementation.**
- [ ] **Step 3: Implement authenticated tenant-scoped server actions using Task 1 schemas and Task 2's draft/snapshot columns; add database-managed revision CAS and retain RLS as the authorization boundary.**
- [ ] **Step 4: Implement the dashboard editor with explicit fields, field-level errors, page checklist, desktop/mobile preview styled by the chosen sector template, save draft, publish/unpublish, and no generic filler copy.**
- [ ] **Step 5: Add Store pages to AppShell navigation and verify its active state, editor forms, and preview at desktop/narrow widths.**
- [ ] **Step 6: Run focused tests and `pnpm --filter @commerce-os/web typecheck`; write a report including red/green evidence. Do not apply the migration or run pgTAP against any database for this task.**
