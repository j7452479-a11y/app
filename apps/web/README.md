# Commerce OS application

Commerce OS is a multi-tenant managed commerce service for Indian businesses. The hosted storefront offers 14 business-specific design archetypes, alongside merchant accounts, workspaces, catalog and inventory, checkout, orders and fulfilment, revision requests, campaign requests, plan entitlements, and a constrained AI support assistant.

## Run locally

From the repository root:

```powershell
pnpm install
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm --filter @commerce-os/web dev
```

The app opens on `http://localhost:3000`. Before sign-up and workspace data can work, create a Supabase project, enter its URL and publishable key in `apps/web/.env.local`, then apply the SQL migrations in `supabase/migrations` in filename order (including `202610080009_storefront_archetypes.sql`). Configure Supabase Auth email confirmation and allow `http://localhost:3000/auth/callback` as a redirect URL.

## Provider setup

The service intentionally uses two distinct payment configurations:

- Platform subscriptions use the platform operator's Razorpay account. Create Razorpay plans with `pnpm --filter @commerce-os/web setup:razorpay-plans` after setting the platform Razorpay credentials. Copy the printed IDs into `RAZORPAY_PLAN_BASIC`, `RAZORPAY_PLAN_PLUS`, and `RAZORPAY_PLAN_PRO`. Configure the Razorpay subscription webhooks to `https://YOUR_APP/api/webhooks/razorpay` and the platform webhook secret in `RAZORPAY_WEBHOOK_SECRET`.
- Shopper payments use each merchant's own Razorpay account. A workspace owner enters the merchant Key ID, API secret, and webhook secret under Settings. The API and webhook secrets are AES-256-GCM encrypted using `PAYMENT_CREDENTIALS_ENCRYPTION_KEY`. Configure the merchant account webhook to `https://YOUR_APP/api/webhooks/store-payment`, then test a payment before enabling live keys. Cash on delivery can also be switched on independently.
- AI support requires a server-side `OPENAI_API_KEY` and `OPENAI_MODEL`. Requests are sent without conversation history, memory, tools, or storefront writes. Provider data retention still follows the provider account's settings and terms.

Generate a 32-byte encryption key locally, for example with Node's `crypto.randomBytes(32).toString('base64')`, and store it in the deployment secret manager. Do not put live secrets in source control or `NEXT_PUBLIC_*` variables. The Supabase service role key is required by server-only payment and usage handling and must never be exposed to browsers.

- Order receipts use Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Without them, checkout and payment can still complete, but receipts are not sent. Configure Supabase Auth SMTP separately for confirmation and password recovery.
- Custom-domain setup requires a Vercel project and `VERCEL_TOKEN` plus `VERCEL_PROJECT_ID` (and `VERCEL_TEAM_ID` for a team project). A merchant adds a domain in Settings, copies the displayed DNS records to their registrar, waits for DNS propagation, then verifies it in the app. Vercel provisions TLS after the domain is correctly connected. DNS targets can be project/account-specific; use the exact records shown by the hosting provider if they differ from the common defaults displayed by the app.
- `GET /api/health` checks service-role database access and whether the public key can reach the migrated database resolver, then reports optional integrations without exposing secret values. A healthy response is not a substitute for checkout, webhook, restore, or security exercises.
- Apply all migrations in `supabase/migrations` in filename order. `202610110011_operational_runtime.sql` enables the database scheduler, schedules expired payment-hold cleanup every five minutes, and prunes old chat rate-limit counters daily. Confirm both jobs appear in Supabase Cron after migration.

## Current operational limits

- Custom domains now connect to Vercel's project-domain API, expose provider DNS records, and have a public host-to-store resolver that fails closed unless the domain is verified, the store is published, and the subscription is eligible. This remains inactive until a real Vercel project/token is configured, registrar DNS is changed by the domain owner, and TLS/routing are verified on the deployed host. The app cannot change a merchant's registrar settings.
- Expired online-payment stock holds are scheduled for cleanup every five minutes through Supabase Cron. This job exists only after the latest migration has been applied to the target database; verify its schedule and execution in the Supabase project.
- Privacy and terms routes are review drafts, not publication-ready legal documents. Add the operating entity, contacts, actual provider disclosures, retention schedules, tax, consumer, cancellation, refund and grievance terms, then have Indian counsel review them.
- The 14 storefront archetypes change art direction and information hierarchy, but still use the common product, cart, address and payment model. Genre-specific features such as product variants, live delivery windows, food modifiers, subscriptions, B2B quote requests and service bookings are not enabled. See `sites/Commerce_OS_Design_Analysis.md` for the reference synthesis and the honest feature boundary.
- The public marketplace now has dedicated Templates, Solutions, Help and Start pages, with searchable sector filters and a responsive editorial design inspired by the supplied Shelf reference. The private Lovable collaborator project could not be accessed from this account, so only the public preview was used. These frontend changes do not mean production hosting is configured.
- Plan copy now reflects the current business proposal: month one free from first publication, then ₹5,000 for Basic / one site, ₹15,000 for Plus / up to three sites, and ₹20,000 for Pro / up to five sites. The database and workspace still enforce one store per organization, so Plus/Pro multi-site entitlements are presentation only until the multi-store schema, store switching, and per-store data isolation are implemented.
- An all-plan customer message inbox is implemented with order-scoped links, private Supabase Storage attachments, text/image/audio messages, polling, and merchant replies. It is not a WhatsApp network integration, and real-time push delivery is not included. Production use depends on applying the conversation and operational migrations, configuring Storage/Auth, and validating abuse limits and uploads on the live project.
- Pro storefronts include an installable PWA experience with a store-specific manifest and app-like shell. This is not a signed Android/iOS binary or a Play/App Store submission; those require the client’s developer accounts, signing, store listings, and review.
- Plus and Pro multi-site counts are displayed as plan entitlements, but the current organization/store schema still allows only one store per organization; true multi-site management and isolation remain to be built.
- Receipt email is sent through Resend when configured; Supabase Auth confirmation/reset email still needs SMTP setup. Order-status notifications are not yet wired as a complete transactional email workflow.
- The connected Supabase project is now reachable and has the conversation, operational-runtime, and security-index migrations applied. The local `.env.local` still needs to be updated with that project's URL, publishable key, and service-role key before the app can use it. Production is not launched: no Vercel project is visible to the connected account, and payment, email, monitoring, and DNS-provider configuration remain outstanding.
- Backups/restore drills, monitoring and alert routing, incident response, staffing, load/abuse exercises, production RLS integration testing, penetration/security review, merchant onboarding operations, and legal review remain launch requirements. These require live services, operator decisions, and/or qualified professionals; source changes cannot complete them alone.

## Build

```powershell
pnpm --filter @commerce-os/web typecheck
pnpm --filter @commerce-os/web build
```
