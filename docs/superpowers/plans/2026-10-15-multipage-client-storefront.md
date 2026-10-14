# Multi-page Client Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build editable, multi-page customer storefronts with readable product URLs, 14 distinct sector treatments, existing checkout/chat behavior, and Plus/Pro order tracking.

**Architecture:** Add tenant-scoped structured page content and stable product slugs in a forward-only Supabase migration. A guided merchant editor owns informational page drafts/publication; the public store uses shared navigation and a persistent cart around independent server-rendered routes, with sector-specific composition and a token-authorized tracking endpoint.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase/Postgres RLS, Zod 4, Vitest, CSS, existing Razorpay checkout and customer-chat capability tokens.

**Spec:** `docs/superpowers/specs/2026-10-15-multipage-client-storefront.md`

## Global Constraints

- Preserve existing checkout, payment, order, inventory, chat, recommendation, PWA, and plan behaviors unless a change is necessary for these page flows.
- Do not invent contact details, delivery promises, return terms, business history, or other factual claims.
- Existing stores must not be made unavailable merely because new content has not been entered.
- Public reads must return only published pages belonging to an available, published store.
- Customer chat stays accessible on all plans; order tracking is enabled only for Plus/Pro.
- Recommendations and downloadable/PWA app remain Pro-only as they are today.
- Motion must not delay navigation, cart actions, checkout, or content visibility; honor `prefers-reduced-motion`.
- Database changes are forward-only, backward-compatible, and protected by RLS.

## Review Focus

- Malformed, oversized, or unsafe merchant page input must be rejected before save or publish; test each page schema and publish-readiness validator.
- Draft pages and cross-tenant content must never be visible publicly; add database-policy tests for anonymous, same-tenant, and other-tenant roles.
- Product-name collisions and edits must not change existing product URLs; test deterministic backfill/new slugs and uniqueness.
- A Basic customer must not retrieve tracking data even with a valid order token; test plan gating at the server/API boundary.
- Empty carts, missing optional merchant fields, and stores with no new page content must remain usable; test fallbacks and route rendering.

---

### Task 1: Add storefront schema utilities and test harness

**Files:**
- Create: `apps/web/vitest.config.ts` (jsdom environment and `@/` alias)
- Modify: `apps/web/package.json` (add `test` script plus Vitest and jsdom dev dependencies)
- Create: `apps/web/src/lib/store-pages.ts`
- Create: `apps/web/src/lib/storefront-utils.ts`
- Test: `apps/web/src/lib/store-pages.test.ts`
- Test: `apps/web/src/lib/storefront-utils.test.ts`

**Interfaces:**
- Produces `StorePageType = "about" | "contact" | "faq" | "shipping_returns"` and a typed `StorePageContent` discriminated union.
- Produces `parseStorePageContent(pageType, input)` using Zod; return a typed success value or field-level validation errors, never render arbitrary HTML.
- Produces `isStorePageReady(pageType, content)` for publish checklist validation.
- `apps/web/src/lib/storefront-utils.ts` exports `createProductSlug(name, productId)` for deterministic, readable, collision-resistant per-product slugs and `isOrderTrackingEnabled(plan)` returning true only for `plus` and `pro`.

- [ ] **Step 1: Write failing schema and helper tests**
  - `parseStorePageContent` accepts valid About, Contact, FAQ, and Shipping & Returns payloads.
  - Reject blank required fields, invalid contact URLs, oversized text, malformed FAQ pairs, and unsupported page types.
  - `isStorePageReady` requires page-specific mandatory facts but permits omitted optional contact fields.
  - `createProductSlug` normalizes punctuation/diacritics, appends a stable product-ID suffix, and returns the same slug for repeated inputs.
  - `isOrderTrackingEnabled` is false for `basic` and true for `plus`/`pro`.
- [ ] **Step 2: Run `pnpm --filter @commerce-os/web test -- src/lib/store-pages.test.ts src/lib/storefront-utils.test.ts` and confirm the new tests fail for missing modules/behavior.**
- [ ] **Step 3: Implement the Zod schemas and pure helpers in `apps/web/src/lib/store-pages.ts` and a focused storefront utility module.**
- [ ] **Step 4: Run the two targeted Vitest files and confirm all assertions pass.**

### Task 2: Persist merchant pages and product slugs securely

**Files:**
- Create: `supabase/config.toml` (minimal local CLI configuration if needed for database tests)
- Create: `supabase/migrations/202610150001_store_pages_and_product_slugs.sql`
- Test: `supabase/tests/storefront_pages.test.sql`
- Modify: `apps/web/src/lib/store-pages.test.ts` only if database-compatible values require a shared fixture.

**Interfaces:**
- `public.store_pages`: one row per `(organization_id, page_type)`, structured `content jsonb`, nullable `published_at`, timestamps, constrained page type, and tenant foreign key.
- `public.products.slug`: non-null, unique within `organization_id`; existing rows receive deterministic readable slugs with collision handling; new rows receive an immutable name-based slug with an ID suffix when not explicitly provided.
- RLS grants merchant read/write under existing organization role and workspace-entitlement rules; anonymous reads are limited to published pages for published stores. Do not grant anonymous writes or broad table access.

- [ ] **Step 1: Write pgTAP tests for page-type constraints, tenant ownership, anonymous visibility of published pages only, no cross-tenant access, product slug uniqueness, and slug immutability when a product name changes.**
- [ ] **Step 2: Configure the local Supabase CLI project without adding project secrets; run `supabase test db` and confirm the tests fail against the pre-migration schema.**
- [ ] **Step 3: Implement the forward-only migration, including safe backfill, indexes, grants, RLS policies, and slug-generation trigger.**
- [ ] **Step 4: Run `supabase test db` against the local database and confirm all policy and constraint tests pass.**
- [ ] **Step 5: Inspect the generated SQL diff and verify it does not alter existing product/order/payment or store-availability behavior.**

### Task 3: Build the guided Store pages editor

**Files:**
- Create: `apps/web/src/app/store/pages/page.tsx`
- Create: `apps/web/src/app/store/pages/actions.ts`
- Create: `apps/web/src/app/_components/store-pages-editor.tsx`
- Modify: `apps/web/src/app/_components/app-shell.tsx` (add Store pages navigation)
- Modify: `apps/web/src/app/features.css` (editor layout, checklist, preview states)
- Test: `apps/web/src/app/store/pages/actions.test.ts`

**Interfaces:**
- `saveStorePage(formData): Promise<ActionState>` validates with `parseStorePageContent`, resolves the signed-in user's organization, and upserts only that tenant's draft.
- `setStorePagePublished(formData): Promise<ActionState>` validates readiness server-side before setting `published_at`; unpublish remains possible without deleting content.
- `StorePagesEditor` receives the page records and selected template; renders bounded forms for About, Contact, FAQ, and Shipping & Returns; displays draft/published state, page-specific checklist, and desktop/mobile preview.

- [ ] **Step 1: Write failing action tests for unauthenticated saves, invalid content, cross-tenant IDs, incomplete publish, valid publish, and unpublish.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Implement authenticated tenant-scoped server actions using the shared schemas; rely on RLS as the second boundary.**
- [ ] **Step 4: Implement the dashboard editor with explicit fields, field-level errors, preview, save draft, publish/unpublish, and no generic filler copy.**
- [ ] **Step 5: Run action/editor tests and verify the AppShell navigation works at desktop and narrow widths.**

### Task 4: Create shared public-store shell and persistent cart

**Files:**
- Create: `apps/web/src/app/s/[slug]/layout.tsx`
- Create: `apps/web/src/app/_components/storefront-shell.tsx`
- Create: `apps/web/src/app/_components/storefront-cart.tsx`
- Create: `apps/web/src/app/_components/storefront-navigation.tsx`
- Modify: `apps/web/src/app/_components/storefront.tsx` (extract current cart/checkout behavior without changing server action contracts)
- Modify: `apps/web/src/app/features.css`
- Test: `apps/web/src/app/_components/storefront-cart.test.tsx`

**Interfaces:**
- `StorefrontShell` receives slug, store identity/template, published page links, plan entitlements, and children; owns consistent header/footer and cart provider.
- `useStorefrontCart()` exposes `items`, `setQuantity`, `addItem`, `removeItem`, `clear`, and `totalPaise`; persists per store in `localStorage` and validates restored IDs/quantities against current products before checkout.
- Existing checkout remains server-authoritative and uses its existing order-creation/payment actions.

- [ ] **Step 1: Write failing tests for add/update/remove, per-store persistence, corrupt storage, empty-cart behavior, and reduced-motion-safe controls.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Extract cart state into the provider and mount it in the slug layout; preserve existing server-side checkout validation.**
- [ ] **Step 4: Add responsive semantic navigation, page-current indication, accessible cart affordance, and footer links only for published pages.**
- [ ] **Step 5: Run cart tests plus `pnpm --filter @commerce-os/web typecheck`.**

### Task 5: Implement Shop and product detail routes

**Files:**
- Modify: `apps/web/src/app/s/[slug]/page.tsx` (compose the Home route in the shared shell)
- Create: `apps/web/src/app/s/[slug]/shop/page.tsx`
- Create: `apps/web/src/app/s/[slug]/products/[productSlug]/page.tsx`
- Create: `apps/web/src/app/_components/storefront-product-card.tsx`
- Create: `apps/web/src/app/_components/storefront-catalog.tsx`
- Create: `apps/web/src/app/_components/storefront-product-detail.tsx`
- Modify: `apps/web/src/app/_components/storefront.tsx` (reuse catalog/product/cart actions as needed)
- Test: `apps/web/src/lib/storefront-routing.test.ts`

**Interfaces:**
- Public product queries select only published products for the store organization and available store slug.
- Product detail route resolves `productSlug` within that organization and calls `notFound()` for missing, draft, archived, or cross-tenant products.
- Catalog accepts only available fields (name, description, price, stock, image) and provides search, in-stock filtering, and price/name sorting without pretending unavailable categories/specifications exist.
- Product add-to-cart uses the shared cart provider; checkout behavior is unchanged.

- [ ] **Step 1: Write failing route/helper tests for published-only queries, unknown slug, cross-tenant product, search/filter/sort, and stable cart additions.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Add server-rendered Shop and product detail routes with metadata and strict organization scoping.**
- [ ] **Step 4: Implement sector-aware product card/catalog/detail presentation using the shared cart provider.**
- [ ] **Step 5: Verify Home → Shop → Product → Cart → existing checkout remains connected; run tests and typecheck.**

### Task 6: Render published About, Contact, FAQ, and Shipping & Returns pages

**Files:**
- Create: `apps/web/src/app/s/[slug]/about/page.tsx`
- Create: `apps/web/src/app/s/[slug]/contact/page.tsx`
- Create: `apps/web/src/app/s/[slug]/faq/page.tsx`
- Create: `apps/web/src/app/s/[slug]/policies/shipping-returns/page.tsx`
- Create: `apps/web/src/app/_components/storefront-information-page.tsx`
- Create: `apps/web/src/app/_components/storefront-page-layout.tsx`
- Modify: `apps/web/src/app/_components/storefront-shell.tsx` (published links/footer fields)
- Modify: `apps/web/src/app/features.css`
- Test: `apps/web/src/lib/storefront-page-rendering.test.ts`

**Interfaces:**
- Shared page renderer receives `StorePageType`, validated content, template ID, and store identity; outputs semantic page content without interpreting arbitrary HTML.
- Missing or unpublished pages return `notFound()` and are absent from nav/footer. Missing optional fields are omitted.
- Metadata uses merchant-supplied page titles/descriptions when present; otherwise uses safe store/page names, never fabricated business claims.

- [ ] **Step 1: Write failing tests for unpublished/missing page behavior, omitted optional contact fields, FAQ content, and shipping policy completeness.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Implement organization-scoped published page fetches and four server-rendered routes.**
- [ ] **Step 4: Implement readable sector-specific content layouts and contact links only when values are supplied.**
- [ ] **Step 5: Verify all four pages from the dashboard preview through the public navigation; run tests and typecheck.**

### Task 7: Add Plus/Pro-only order tracking using the order capability token

**Files:**
- Modify: `apps/web/src/app/api/customer-chat/route.ts` or Create: `apps/web/src/app/api/customer-order/route.ts` (prefer a dedicated read-only tracking endpoint)
- Create: `apps/web/src/app/s/[slug]/orders/track/page.tsx`
- Create: `apps/web/src/app/_components/storefront-order-tracking.tsx`
- Modify: `apps/web/src/app/_components/order-chat.tsx` (link to tracking only when entitled, without gating chat)
- Modify: `apps/web/src/app/_components/storefront-shell.tsx` (Plus/Pro tracking link)
- Test: `apps/web/src/app/api/customer-order/route.test.ts`

**Interfaces:**
- Tracking request sends the existing 64-character order capability token; server hashes it, resolves only the matching order, verifies the store belongs to the route slug, and checks current plan is Plus/Pro before returning minimum required status data.
- Basic plan receives a non-sensitive unavailable response and never receives order/customer data. Do not expose order lookup by guessable order number/email.
- Customer chat endpoint and attachment permissions remain unchanged and available for all plans.

- [ ] **Step 1: Write failing API tests for invalid token, unknown token, wrong store slug, Basic plan, Plus/Pro success, and response data minimization.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Implement the server-side capability/tenant/plan checks and no-store response behavior.**
- [ ] **Step 4: Implement the tracking page with clear state labels and no extra personal information.**
- [ ] **Step 5: Verify chat remains available on Basic/Plus/Pro and tracking is restricted to Plus/Pro; run targeted tests.**

### Task 8: Complete sector-specific responsive design and end-to-end verification

**Files:**
- Modify: `apps/web/src/lib/storefront-templates.ts`
- Modify: `apps/web/src/app/_components/storefront.tsx`
- Modify: storefront shell/catalog/product/page components and `apps/web/src/app/features.css`
- Test: `apps/web/src/lib/storefront-templates.test.ts`

**Interfaces:**
- Each of the 14 existing template IDs defines explicit typography/layout/motion traits and uses the same semantic commerce APIs established in earlier tasks.
- CSS motion has reduced-motion fallbacks; no interaction relies on animation completion.

- [ ] **Step 1: Write template coverage tests asserting all 14 IDs have a complete visual profile and reduced-motion-safe animation setting.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Implement distinct sector-specific page rhythm, imagery treatment, type scale, product density, and appropriate motion; keep a common accessible navigation/checkout foundation.**
- [ ] **Step 4: Run all storefront tests, `pnpm --filter @commerce-os/web typecheck`, `pnpm --filter @commerce-os/web lint`, and `pnpm --filter @commerce-os/web build`.**
- [ ] **Step 5: Manually verify Home, Shop, product detail, informational pages, cart, checkout handoff, chat, and plan-gated tracking at desktop/mobile widths; verify reduced motion and keyboard navigation.**

## Completion Review

- Review the final diff for cross-tenant data exposure, draft leakage, unsafe HTML, plan entitlement regressions, and changes to checkout/payment authority.
- Confirm no generic copy or invented policy/contact facts were added.
- Confirm migration ordering and existing storefront compatibility; do not claim a live database migration or production deployment unless those are separately configured and verified.
