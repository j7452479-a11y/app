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
- Use these content shapes: About `{ story, headline?, mediaUrl? }`; Contact `{ email?, phone?, websiteUrl?, address?, serviceArea?, hours? }`; FAQ `{ items: [{ question, answer }] }`; Shipping & Returns `{ deliveryAreas, deliveryTime, shippingCharges, returnWindow, returnEligibility, returnSteps, returnContact? }`. Trim strings. Bounds: story 10–5000 chars; headline 1–100; phone 3–30; website URL HTTPS only; address/serviceArea/hours 1–500; FAQ has 1–30 items, question 3–180 and answer 3–2000; each required shipping/returns field 3–2000; returnContact 1–254. Validate supplied email/URL fields.
- Readiness: About requires `story`; Contact requires at least one of email, phone, website URL, address, or service area; FAQ requires at least one complete item; Shipping & Returns requires all fields except `returnContact`.
- Produces `parseStorePageContent(pageType, input)` using Zod; return a typed success value or field-level validation errors, never render arbitrary HTML.
- Produces `isStorePageReady(pageType, content)` for publish checklist validation.
- `apps/web/src/lib/storefront-utils.ts` exports `createProductSlug(name, productId)` for deterministic, readable, collision-resistant per-product slugs and `isOrderTrackingEnabled(plan)` returning true only for `plus` and `pro`.

- [ ] **Step 1: Write failing schema and helper tests**
  - `parseStorePageContent` accepts valid About, Contact, FAQ, and Shipping & Returns payloads.
  - Reject blank required fields, invalid contact URLs, oversized text, malformed FAQ pairs, and unsupported page types.
  - `isStorePageReady` requires page-specific mandatory facts but permits omitted optional contact fields.
- `createProductSlug` NFKD-normalizes diacritics, converts other punctuation runs to hyphens, caps the readable name portion at 180 characters and trims any trailing hyphen at the cut, falls back to `product`, then appends the complete lowercase alphanumeric UUID of the product ID. Using the full UUID guarantees uniqueness even when product IDs share a prefix. Product-name changes must not change an already assigned slug/URL.
  - `isOrderTrackingEnabled` is false for `basic` and true for `plus`/`pro`.
- [ ] **Step 2: Run `pnpm --filter @commerce-os/web test -- src/lib/store-pages.test.ts src/lib/storefront-utils.test.ts` and confirm the new tests fail for missing modules/behavior.**
- [ ] **Step 3: Implement the Zod schemas and pure helpers in `apps/web/src/lib/store-pages.ts` and a focused storefront utility module.**
- [ ] **Step 4: Run the two targeted Vitest files and confirm all assertions pass.**
