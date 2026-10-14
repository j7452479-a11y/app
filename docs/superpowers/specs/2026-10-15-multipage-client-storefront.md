# Multi-page client storefront design

## Status

Design approved by the user. This is a product and implementation specification, not evidence that production payments, hosting, or live merchant content are configured.

## Goal

Turn each merchant's customer-facing store into a complete, credible multi-page commerce website, with sector-specific visual character and useful product discovery. It must feel intentionally designed for the merchant's business—not like one generated theme repeated with different colors—while preserving the current commerce behavior.

## User-approved decisions

- Every storefront supports Home, Shop, product detail, About, Contact, FAQ, and Shipping & Returns pages.
- Merchants provide business-specific informational content through a guided Store pages editor. Do not invent contact details, delivery promises, return terms, business history, or other factual claims.
- The dashboard editor provides sector-template previews and a publishing/readiness checklist. An informational page with missing required facts remains unpublished and is omitted from customer navigation.
- Use a shared, predictable navigation and cart/checkout model, but distinct page compositions and restrained motion for each sector.
- Keep text readable, work well on mobile, and respect reduced-motion preferences.
- Product detail URLs should be stable and readable.
- Customer messaging remains available on every plan. Order tracking remains limited to Plus and Pro.
- Preserve existing checkout, payment, order, inventory, chat, recommendation, PWA, and plan behaviors unless a change is necessary for these page flows.

## Existing baseline and constraints

- The public store is currently implemented at `/s/[slug]` in `apps/web/src/app/s/[slug]/page.tsx` and rendered by `apps/web/src/app/_components/storefront.tsx`.
- The current storefront fetches store name/description/template and published products; product records provide one image URL, name, description, price, and stock state. There are no merchant page records for About, FAQs, contact details, or delivery/returns policy.
- Store templates are defined in `apps/web/src/lib/storefront-templates.ts`; there are 14 IDs: `essential`, `fashion`, `beauty`, `electronics`, `home`, `grocery`, `food`, `artisan`, `luxury`, `local`, `b2b`, `subscription`, `services`, and `marketplace`.
- The dashboard currently has store settings but no dedicated store-page editor. Customer order chat is order-scoped. Plan entitlements already gate Pro recommendations/app and should not be broadened by this work.
- `B:/new/files` is a visual reference catalog (including sector-relevant hero/scroll/button combinations), not a source of merchant facts or implementation instructions. Take visual cues only; do not copy unrelated SaaS patterns or use a single animation recipe everywhere.
- Existing product and store records must continue to render. Page content should be additive and backward-compatible; existing stores must not be made unavailable merely because new content has not been entered.

## Customer information architecture

All paths are nested below the current store slug:

| Page | Route | Behavior |
|---|---|---|
| Home | `/s/[slug]` | Sector-led landing page, featured/recent products, clear route to Shop and store story. |
| Shop | `/s/[slug]/shop` | Full product catalogue with search and useful filters/sorting appropriate to available product data. |
| Product detail | `/s/[slug]/products/[productSlug]` | Product imagery, description, price, stock state, quantity/add-to-cart, and related products only when supported and entitled. |
| About | `/s/[slug]/about` | Merchant-entered story and optional supporting media. |
| Contact | `/s/[slug]/contact` | Merchant-entered contact channels, location/service area, and hours; only show supplied fields. |
| FAQ | `/s/[slug]/faq` | Merchant-authored question/answer list; no generated answers presented as business policy. |
| Shipping & Returns | `/s/[slug]/policies/shipping-returns` | Merchant-entered delivery and returns information, shown only after required sections are complete. |
| Order tracking | `/s/[slug]/orders/track` | Available only to Plus/Pro stores. Safe order lookup and status display; never expose another customer's order. |

Navigation is consistent, responsive, keyboard accessible, and exposes the current page. Desktop can use a restrained primary nav plus footer links; mobile uses a compact menu with a persistent cart affordance. Only published informational pages appear in navigation. Home, Shop, and product detail routes remain part of the core storefront. The footer repeats only available pages and merchant-provided contact details.

## Merchant content and publishing workflow

Add a dedicated Store pages area in the merchant dashboard. It should provide a guided sequence rather than a blank canvas:

1. Select a page and see why it helps customers.
2. Fill clearly labeled, bounded fields (About story; contact email/phone/address or service area/hours; FAQ pairs; delivery areas/timing/charges; return eligibility/window/steps/contact).
3. Preview desktop and mobile using the store's selected sector template.
4. Save as draft, inspect a page-specific checklist, then publish/unpublish that page.
5. Preview the complete storefront navigation and footer before publishing.

Validation prevents whitespace-only content, unsafe URLs, oversized text/media, and incomplete mandatory fields. Optional fields are omitted rather than filled with generic copy. The existing store can remain live while a page is drafted or edited. Store-page publication is distinct from store publication and does not restart or alter the subscription trial.

Suggested persistence: a tenant-scoped `store_pages` record keyed by organization and page type, with validated structured JSON content, published state, timestamps, and metadata needed for SEO. Keep fields schema-driven and versionable; avoid accepting arbitrary HTML. Public reads must return only published pages belonging to an available, published store. Merchant writes must be constrained by existing organization roles and subscription workspace entitlements. Add appropriate indexes, grants, and RLS policies in a new forward-only Supabase migration.

For products, add a stable per-store slug (unique within the store) and use it for detail URLs. Existing products need deterministic backfilled slugs with collision handling. Keep the current product model and checkout payload intact; additional gallery/category fields are optional only if the implementation can support them end-to-end without blocking this delivery.

## Sector-specific design direction

Use a shared accessibility, spacing, navigation, form, and commerce-control foundation. Within it, vary typography, image treatment, page rhythm, density, and motion according to the business:

| Template | Page composition and motion character |
|---|---|
| Essential commerce | Balanced editorial grid, friendly typography, understated fade/slide reveals. |
| Fashion | Collection/editorial layouts, confident type contrast, slow image parallax and restrained stagger. |
| Beauty | Calm, ingredient/routine storytelling, tactile close crops, soft transitions. |
| Electronics | Dense but legible comparison/specification patterns, crisp state changes, minimal motion. |
| Home | Room/material-led image compositions, spatial transitions, measured parallax. |
| Grocery | Category-first compact browsing, fast add-to-cart feedback, no slow decorative transitions. |
| Food | Menu-led hierarchy and appetizing product photography, quick cart feedback and subtle reveals. |
| Artisan | Maker/provenance storytelling, material detail, warm editorial reveals. |
| Luxury | Quiet negative space, discreet controls, slow restrained motion and sharp contrast. |
| Local | Place-first voice, warm direct contact cues, approachable transitions. |
| B2B | Search/specification-first structure, highly legible tables and practical minimal animation. |
| Subscription | Explain cadence and terms clearly, sequence the first-box journey, avoid implying recurring billing until implemented. |
| Services | Outcome/expertise narrative and clear inquiry route; commerce controls only where products are sold. |
| Marketplace | Search-led catalogue, scalable category/navigation density, efficient browsing interactions. |

Reference combination IDs noted in `B:/new/files/top-100-hero-scroll-button-combinations.md` (for example fashion/editorial, artisan, gastronomy, interiors, botanicals, and quiet luxury) can inform motion choices where relevant. Do not import arbitrary third-party snippets, assets, or effects without verifying licensing, accessibility, performance, and suitability.

All pages must maintain readable foreground/background contrast, visible keyboard focus, semantic headings, alt text for meaningful images, touch-friendly controls, responsive layouts, and `prefers-reduced-motion` support. Motion must not delay navigation, cart actions, checkout, or content visibility.

## Commerce and entitlement invariants

- Cart state is shared across Home, Shop, and product details; items remain in cart while navigating within a store.
- Checkout continues through the existing validated server action/provider path. Price and stock remain authoritative on the server.
- Customer chat stays accessible on all plans and remains tied to the customer's order capability token.
- Order tracking is server-authorized and enabled only for Plus/Pro; Basic receives a clear plan explanation without leaking order data.
- Recommendations and downloadable/PWA app remain Pro-only as they are today. Do not add AI recommendations to lower plans.
- Store availability, trial start, payment lock/suspension behavior, and existing plan website limits are unchanged.

## Non-goals

- Replacing the merchant dashboard or commerce backend.
- Copying the Lovable reference wholesale or copying third-party code/assets from the visual catalog.
- Inventing merchant facts or legal language.
- Adding subscription billing for shoppers, variant/inventory redesign, multi-vendor settlement, or new payment providers.
- Claiming a live or production-ready deployment as part of the visual/page implementation.

## Acceptance criteria

1. A customer can navigate Home → Shop → product → cart → checkout without losing cart state or breaking existing order/payment behavior.
2. Product details have stable readable routes and display the correct store's published product only.
3. Merchants can draft, preview, publish, and unpublish About, Contact, FAQ, and Shipping & Returns content in the dashboard.
4. Missing content is never fabricated; unpublished pages are not linked publicly; existing stores remain usable.
5. Public routes are tenant-isolated and honor store availability. Draft content is never returned to anonymous users.
6. Order chat remains available on every plan. Tracking is enabled only for Plus/Pro and cannot reveal a different customer's order.
7. The 14 sector templates have visibly distinct composition and appropriate restrained motion across the new pages, not just palette changes.
8. Mobile, keyboard navigation, contrast, reduced-motion, and loading/empty/error states are handled.
9. Database changes are forward-only, backward-compatible, and protected by RLS; tests cover page publication isolation, slug uniqueness/backfill, and plan entitlements.
