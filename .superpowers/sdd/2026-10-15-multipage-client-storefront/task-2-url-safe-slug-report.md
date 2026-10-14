# Task 2 URL-safe product slug review follow-up

## Changes

- Added `products_slug_url_safe_check` to require persisted product slugs to be 1–2048 characters and match the single-segment format `^[a-z0-9]+(-[a-z0-9]+)*$`. The existing trigger still generates omitted or blank slugs; the generated-slug function was not changed. Invalid explicit values fail with the named check constraint.
- Added pgTAP assertions that a safe custom slug is preserved and explicit slash-containing and uppercase/space-containing slugs are rejected.
- Updated the Task 1 and Task 2 briefs to specify the readable normalized name plus the complete lowercase alphanumeric UUID, documenting collision resistance for shared UUID prefixes and slug stability across product-name changes.
- Bounded the normalized readable name to 180 characters in both `createProductSlug` and `public.product_slug_for`, trimming a hyphen at the cut before applying the `product` fallback and appending the complete lowercase UUID. Added Vitest and pgTAP regression coverage for a long name whose truncation boundary lands on a hyphen, including URL-format and database-length assertions. Updated both briefs with the name-part bound.

## Verification and limitations

- Targeted Vitest regression: expected failure observed before implementation; then passed with 5/5 tests. Full web Vitest suite passed with 16/16 tests.
- `git diff --check`: passed before commit.
- pgTAP was not run, as requested, and no database was contacted. Database execution of the migration and pgTAP assertions remains unverified.
