# Task 2 URL-safe product slug review follow-up

## Changes

- Added `products_slug_url_safe_check` to require persisted product slugs to be 1–2048 characters and match the single-segment format `^[a-z0-9]+(-[a-z0-9]+)*$`. The existing trigger still generates omitted or blank slugs; the generated-slug function was not changed. Invalid explicit values fail with the named check constraint.
- Added pgTAP assertions that a safe custom slug is preserved and explicit slash-containing and uppercase/space-containing slugs are rejected.
- Updated the Task 1 and Task 2 briefs to specify the readable normalized name plus the complete lowercase alphanumeric UUID, documenting collision resistance for shared UUID prefixes and slug stability across product-name changes.

## Verification and limitations

- `git diff --check`: run before commit; result recorded in the final task response.
- pgTAP was not run, as requested. Supabase CLI/Docker are unavailable, and no database was contacted.
- This review follow-up has static review only; database execution of the CHECK and pgTAP assertions remains unverified.
