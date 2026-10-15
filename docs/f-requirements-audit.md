# Commerce OS build status and launch checklist

Audit date: 11 October 2026

The supplied `txt/f.txt` is empty (0 bytes), so it provides no acceptance checklist. This status reflects the Commerce OS brief/SRS elsewhere in `txt/` and `docs/`, plus the current application source under `apps/web`.

## Implemented in the application

- A Next.js app with marketing/pricing, 14 industry storefront archetypes, signup/sign-in/password recovery, merchant workspace navigation and responsive pages.
- Supabase-based account/workspace model and SQL migrations for tenant data, row-level security, store publication, plan entitlements, subscription gates, quotas, revision requests and order transitions.
- Catalog/inventory management and public `/s/[slug]` storefronts with cart/address checkout, cash-on-delivery and a merchant-owned Razorpay payment option.
- Server-side payment initiation, signature validation, provider payment status confirmation, webhook event de-duplication, cancellation/refund handling and stock reservation cleanup.
- Merchant order list/detail, customer/shipping details, allowed fulfilment transitions and Razorpay refund requests.
- Platform Razorpay subscription checkout/webhook integration, plan values, trials beginning on first publication, and the requested past-due gates (workspace lock, checkout cutoff after three days, storefront shutdown after ten days).
- Plan-limited campaign and revision request flows; Plus/Pro support assistant sends single-turn requests without conversation history, tools, or store writes.
- Privacy and terms routes exist, but are expressly drafts pending operator details and legal review.
- An all-plan order conversation path is implemented through one-time random order tokens, private Supabase Storage for image/audio attachments, abuse-rate limiting, and a merchant Messages page. Production use still depends on applying the conversation and operational migrations and configuring Supabase Storage/Auth.
- Pro storefronts include a store-scoped installable PWA experience. This is not a signed Android/iOS binary or an app-store submission.
- Operational code includes a five-minute Supabase Cron schedule for expired payment-hold cleanup, Vercel project-domain add/verify integration, a fail-closed custom-host resolver, and `/api/health` readiness checks. These require provider configuration and a deployed environment before they become operational.

## Not yet a production-ready/live service

The code is not equivalent to a launched business. A connected Supabase project is now reachable and has the conversation, operational-runtime, and security-index migrations applied; the local app environment still needs that project's URL, publishable key, and service-role key. No Vercel project is visible to the connected account, no production hostname or deployment is connected, and no end-to-end transaction has been run against live/test provider accounts. The earlier Vercel preview upload was rejected by the environment's egress reviewer because it would transfer source code externally; it was not retried.

Before onboarding real merchants/customers:

1. Configure the local/deployment environment with the connected Supabase project's URL and keys, configure Auth email delivery/redirects, verify Storage bucket/policies, and run tenant/RLS, checkout-concurrency and recovery exercises against that project. The two Commerce OS Cron jobs are already active in the project.
2. Configure platform Razorpay credentials, create the three monthly plans using the provided setup script, save plan IDs, and register the subscription webhook. Each merchant must also add their own Razorpay API and webhook credentials in workspace settings and test checkout/refund webhooks.
3. Supply a Vercel project and token, set the server-only variables documented in `apps/web/.env.example`, and deploy with HTTPS and a real app URL. Do not put live secrets in source control or browser-visible environment variables. The attempted preview transfer was rejected by the environment; it was not retried.
4. Test the implemented custom-domain flow with a domain whose DNS the operator controls: attach through Vercel, publish exact DNS records, verify provider status/TLS, then confirm active and delinquent subscription host behavior.
5. Configure Resend and a verified sender for receipts; configure Supabase Auth SMTP separately; exercise receipt delivery and password recovery. Complete order-status and support notifications if required by the service policy.
6. Add monitoring/alert routing, backup retention and restore drills, incident response, support staffing, abuse/load controls, production RLS integration exercises, and an independent security review.
7. Replace the legal drafts with terms for the actual operating entity and processors, including privacy/data retention, consumer rights, tax, refund/cancellation, shipping, messaging/consent and grievance contact details, reviewed by qualified Indian counsel.
8. Decide and implement actual campaign delivery/creative approval responsibilities and the service/usage meaning of “full AI support.” The current campaign feature records service requests; it does not buy or serve advertising. The assistant is a constrained support endpoint, not an autonomous agent.
9. Implement true multi-store tenancy for Plus/Pro; their website counts are plan presentation only while the schema permits one store per organization.
10. For the 14 storefront archetypes, implement genre-specific data and journeys before representing them as full specialty shops: variants, ingredients/specs, delivery slots, food modifiers, subscriptions, RFQs and service booking are not yet operational. See `sites/Commerce_OS_Design_Analysis.md`.

## Conclusion

The end-to-end product architecture and a substantial functioning application slice are now present, including public shop, catalog, orders, customer conversations, subscription enforcement, and code paths for scheduled cleanup and custom-domain routing. The production build and TypeScript check pass locally. The requested business is buildable, but it is not live or ready to take real payments until valid provider access, live migrations, deployment/domain setup, operational exercises and legal review above are completed. The setup and run instructions are in `apps/web/README.md`.
