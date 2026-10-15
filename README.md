# Commerce OS 🛍️

> **Independent, Multi-Tenant Managed Digital Commerce Engine for Indian Businesses**  
> Tailored storefronts across 14 sector archetypes, backed by a production-grade merchant operating system, dual-layer payment isolation, order-scoped customer messaging, installable PWA, and server-rendered multi-page architecture.

---

## 📑 Table of Contents

- [Overview & Mission](#-overview--mission)
- [The 14 Sector-Specific Storefront Archetypes](#-the-14-sector-specific-storefront-archetypes)
- [Customer Storefront Architecture](#-customer-storefront-architecture)
- [Merchant Operating System](#-merchant-operating-system)
- [Security & Multi-Tenant Data Isolation](#-security--multi-tenant-data-isolation)
- [Plan Entitlements & Pricing](#-plan-entitlements--pricing)
- [Database Schema & Migrations Index](#-database-schema--migrations-index)
- [Research & Creative Benchmarks](#-research--creative-benchmarks)
- [Repository Structure](#-repository-structure)
- [Getting Started & Developer Guide](#-getting-started--developer-guide)
- [Operational Limits & Launch Readiness](#-operational-limits--launch-readiness)

---

## 🌟 Overview & Mission

For decades, digital commerce platforms treated every business as if it were identical. A high-fashion boutique, a fresh morning bakery, an artisan brassware foundry, and an industrial distributor were all squeezed into the same generic four-column product grid and cold checkout form.

**Commerce OS** is designed specifically to dismantle that uniformity:

1. **Art-Directed Sector Archetypes:** 14 distinct storefront designs shaped by extensive research across 700 category-leading benchmark websites.
2. **True Multi-Page Storefronts:** Complete, credible customer experiences (`Home`, `Shop`, `Product Detail`, `About`, `Contact`, `FAQ`, `Shipping & Returns`, and `Order Tracking`) with stable readable URLs and merchant publication controls.
3. **Turnkey Merchant Operations:** Managed catalogue, real-time stock holds, multi-modal customer chat inbox (voice/image notes), and guided store page drafting with live device previews.
4. **Calibrated for Indian Commerce:** Direct integration paths for Razorpay (platform subscription + encrypted merchant accounts) alongside Cash on Delivery (COD), hyperlocal delivery radius support, and instant WhatsApp-style communication.
5. **Progressive Web App (PWA):** Pro tier provides installable mobile app shells with tenant-scoped webmanifests and offline-ready icons without app store friction.

---

## 🎨 The 14 Sector-Specific Storefront Archetypes

Each archetype features tailored visual rhythm, typography scales, product card density, color palettes, and motion dynamics suited to its industry:

| # | Archetype ID | Sector Name | Target Merchants | Key Design Traits & UX Patterns | Spec Reference |
|---|--------------|-------------|------------------|---------------------------------|----------------|
| **01** | `essential` | **Essential Commerce** | General retail, daily essentials, brand shops | Clean product grid, large search bar, category navigation, simple checkout, mobile-first UX | [`01-essential-commerce.md`](sites/01-essential-commerce.md) |
| **02** | `fashion` | **Fashion Atelier** | Apparel, designer labels, boutiques, jewelry | Editorial photography, oversized visual cards, collection lookbooks, size/color swatches | [`02-fashion-atelier.md`](sites/02-fashion-atelier.md) |
| **03** | `beauty` | **Beauty Studio** | Cosmetics, skincare, organic wellness, salons | Soft hierarchy, routine steps, ingredient disclosure, before/after proof, trust badges | [`03-beauty-studio.md`](sites/03-beauty-studio.md) |
| **04** | `electronics` | **Electronics Grid** | Tech hardware, gadgets, audio gear, accessories | Specification-dense cards, comparison tables, faceted filters, real-time stock state | [`04-electronics-grid.md`](sites/04-electronics-grid.md) |
| **05** | `home` | **Home and Furniture** | Furniture, interior decor, lighting, lifestyle | Room-based collections, material and dimension diagrams, delivery lead-times, high-res galleries | [`05-home-and-furniture.md`](sites/05-home-and-furniture.md) |
| **06** | `grocery` | **Grocery & Daily Needs** | Supermarkets, quick commerce, organic farm produce | Fast category browsing, repeat-reorder tray, delivery postal validation, cart-first checkout | [`06-grocery-and-daily-needs.md`](sites/06-grocery-and-daily-needs.md) |
| **07** | `food` | **Food & Restaurant Shop** | Bakeries, cafes, gourmet cloud kitchens, confectioners | Visual menu categories, dietary tags, pickup vs. delivery selector, appetizing imagery | [`07-food-and-restaurant-shop.md`](sites/07-food-and-restaurant-shop.md) |
| **08** | `artisan` | **Artisan Market** | Craftsmen, handloom, ceramicists, niche creators | Maker provenance spotlight, craft storytelling, batch releases, limited-run badges | [`08-artisan-market.md`](sites/08-artisan-market.md) |
| **09** | `luxury` | **Premium Luxury** | Haute couture, horology, fine gems, heritage goods | Minimalist navigation, expansive negative space, high-contrast serif typography, VIP inquiry | [`09-premium-luxury.md`](sites/09-premium-luxury.md) |
| **10** | `local` | **Local Business** | Neighborhood stores, city merchants, regional trade | Location-first header, direct WhatsApp/phone ordering, hyperlocal delivery radius, regional deals | [`10-local-business.md`](sites/10-local-business.md) |
| **11** | `b2b` | **B2B Catalog** | Wholesalers, manufacturers, industrial distributors | Request-a-quote (RFQ) workflows, tiered bulk pricing, downloadable specification sheets | [`11-b2b-catalog.md`](sites/11-b2b-catalog.md) |
| **12** | `subscription` | **Subscription Products** | Recurring meal kits, coffee clubs, wellness boxes | Delivery frequency selectors, subscribe & save economics, self-serve pause/skip modal | [`12-subscription-products.md`](sites/12-subscription-products.md) |
| **13** | `services` | **Professional Services** | Consultants, studios, agencies, wellness practitioners | Structured service packages, tier comparison matrices, interactive intake forms, bookings | [`13-professional-services.md`](sites/13-professional-services.md) |
| **14** | `marketplace` | **Modern Marketplace Style** | Multi-category retailers, concept department stores | Mega-menu navigation, search-dominant hero, dynamic promotional ribbons, deep facet filters | [`14-modern-marketplace-style.md`](sites/14-modern-marketplace-style.md) |

---

## 🏛️ Customer Storefront Architecture

Every merchant store lives under an isolated slug route: `/s/[slug]`. All customer routes are server-rendered with responsive navigation and a unified, client-side persistent cart:

```
/s/[slug]/
├── page.tsx                             # Home: Sector-led hero, featured shelf, brand narrative
├── shop/page.tsx                        # Shop: Complete catalog, live stock filter, search & sort
├── products/[productSlug]/page.tsx      # Product Detail: High-res images, stock badges, add-to-cart
├── about/page.tsx                       # About: Merchant-authored founder story & studio origins
├── contact/page.tsx                     # Contact: Direct phone, email, physical address/hours
├── faq/page.tsx                         # FAQ: Accordion list of merchant questions & answers
├── policies/shipping-returns/page.tsx   # Policies: Delivery timelines, charges, and return terms
├── orders/track/page.tsx                # Tracking: Token-authorized status tracking (Plus/Pro)
└── manifest.webmanifest/route.ts        # PWA: Dynamic Web App Manifest with tenant icons
```

### Key Architectural Tenets:
- **Zero Fabricated Content:** If a merchant hasn't published an About or FAQ page, that route returns `notFound()` and is gracefully omitted from the navigation and footer.
- **Stable, Collision-Resistant Slugs:** Product URLs use deterministic alphanumeric slugs (`/products/artisan-vase-8f2a1b9c`) so renaming a product never breaks external customer links or bookmarks.
- **Persistent Local Cart:** The cart is maintained across routes and sessions in `localStorage`, validated server-side during checkout against current product availability and live pricing.
- **Token-Authorized Order Tracking:** Tracking does not expose guessable order numbers or customer personal data; lookup requires the cryptographically random 64-character capability token generated at checkout.

---

## 💼 Merchant Operating System

The merchant workspace (`/dashboard`) provides end-to-end control without needing developer assistance:

- **Guided Store Pages Editor (`/store/pages`):** Merchants edit structured JSON drafts for About, Contact, FAQ, and Shipping & Returns pages. Edits remain drafts until explicitly published, ensuring live storefronts never display half-written content. Includes desktop & mobile previews and publishing readiness checklists.
- **Catalogue & Real-Time Inventory (`/products`):** Full stock management with automatic stock-hold reservation during online checkout and automatic release upon expiration.
- **Order Management & Fulfillment (`/orders`):** State transitions from `pending` → `confirmed` → `shipped` → `delivered` or `cancelled`.
- **Customer Messaging Inbox (`/messages`):** Integrated, order-linked chat interface. Shoppers and merchants exchange text, photos, and voice notes stored securely in private Supabase Storage buckets.
- **Dual Payment Setup (`/settings`):** Merchants toggle Cash on Delivery (COD) and input their own Razorpay Key ID and Secret (encrypted at rest using AES-256-GCM).
- **Pro Progressive Web App (PWA):** Shoppers can install the store directly to their mobile home screen with customized application icons and an app-like navigation shell.
- **AI Support Assistant (`/assistant`):** Single-turn, bounded operational assistance for merchants to draft copy and navigate workspace features without risky write privileges.

---

## 🔒 Security & Multi-Tenant Data Isolation

- **PostgreSQL Row Level Security (RLS):** Enabled and strictly enforced on all 13 Supabase migrations. Merchants can only read and write data belonging to their verified `organization_id`.
- **Safe Public Access:** Anonymous visitors can only query `published_content` on `published` stores. Draft records and merchant administrative endpoints are completely inaccessible.
- **Double Payment Isolation:**
  - Platform subscription billing uses the platform operator's Razorpay credentials.
  - Shopper checkout uses the merchant's personal Razorpay account credentials, encrypted at rest via AES-256-GCM using `PAYMENT_CREDENTIALS_ENCRYPTION_KEY`.
- **Capability Tokens:** Order lookup and customer messaging utilize SHA-256 hashed 64-character tokens. No customer can ever guess or enumerate another customer's order or conversation.

---

## 💳 Plan Entitlements & Pricing

Commerce OS operates on a transparent, merchant-first pricing structure:

| Feature / Entitlement | Basic Plan | Plus Plan | Pro Plan |
|-----------------------|------------|-----------|----------|
| **Price** | **₹5,000 / month** | **₹15,000 / month** | **₹20,000 / month** |
| **Free Trial** | 30 Days from 1st Publish | 30 Days from 1st Publish | 30 Days from 1st Publish |
| **Websites Supported** | 1 Storefront | Up to 3 Storefronts | Up to 5 Storefronts |
| **Design Revisions** | 1 included revision | 3 included revisions | 5 included revisions |
| **Customer Messaging** | Included (Text, Audio, Img) | Included (Text, Audio, Img) | Included (Text, Audio, Img) |
| **Customer Order Tracking** | — | ✅ Included | ✅ Included |
| **Campaign Ad Creatives** | — | 4 requests / month | 10 requests / month |
| **AI Assistant** | — | Single-turn Support | Single-turn Support |
| **Installable Pro PWA** | — | — | ✅ Included |
| **AI Recommendations** | — | — | ✅ Included |

> **Trial Policy:** The 30-day free trial clock begins on the exact day the merchant first publishes their store—never while they are still drafting catalogue items.

---

## 🗄️ Database Schema & Migrations Index

Database migrations are located in [`supabase/migrations/`](supabase/migrations/) and must be applied in sequential order:

1. `202610080001_core_commerce.sql`: Core schema (organizations, profiles, stores, products, orders, order items).
2. `202610080002_operations.sql`: Operational models (revisions, campaign requests, billing records).
3. `202610080003_storefront_availability.sql`: Store publication state, domain bindings, and availability checks.
4. `202610080004_entitlements.sql`: Subscription plan limits and workspace feature entitlement checks.
5. `202610080005_revisions.sql`: Revision tracking workflows and staff assignments.
6. `202610080006_store_payments.sql`: Encrypted merchant payment credentials and payment attempt logs.
7. `202610080007_order_transitions.sql`: Formal order state machine functions and transition validation.
8. `202610080008_signup_template.sql`: Template selection persistence across merchant registration.
9. `202610080009_storefront_archetypes.sql`: Support for the 14 storefront design archetypes and visual configurations.
10. `202610110010_customer_conversations.sql`: Order-scoped customer conversations, multi-modal attachments, and security tokens.
11. `202610110011_operational_runtime.sql`: Supabase pg_cron scheduler for 5-minute expired stock hold releases and daily rate limit pruning.
12. `202610110012_security_indexes.sql`: High-performance composite indexes and security hardening.
13. `202610150001_store_pages_and_product_slugs.sql`: Tenant-scoped `store_pages` table (draft vs live snapshots) and collision-resistant product slugs.

---

## 🔬 Research & Creative Benchmarks

This repository contains in-depth market research and design system references:

- **[`sites/`](sites/):** Detailed UX audits and curated directories of **700 industry-benchmark websites** (50 per sector across all 14 sectors).
  - Structured JSON Database: [`sites/all-sites-database.json`](sites/all-sites-database.json)
  - Consolidated Reference: [`sites/all-sites.md`](sites/all-sites.md)
  - Design Analysis Report: [`sites/Commerce_OS_Design_Analysis.md`](sites/Commerce_OS_Design_Analysis.md)
  - Color Palette & Sector Guide: [`sites/commerce-sector-colors.md`](sites/commerce-sector-colors.md)
- **[`files/`](files/):** High-converting UI combinations:
  - Top 100 Hero, Scroll & Button Combinations: [`files/top-100-hero-scroll-button-combinations.md`](files/top-100-hero-scroll-button-combinations.md)
  - Combinations Catalog & Database: [`files/combinations-catalog.html`](files/combinations-catalog.html) and [`files/top-100-combinations-database.json`](files/top-100-combinations-database.json)
- **[`docs/`](docs/):**
  - Comprehensive SRS & Feasibility Study: [`docs/Commerce_OS_Comprehensive_SRS_Feasibility_Report.html`](docs/Commerce_OS_Comprehensive_SRS_Feasibility_Report.html)
  - Multipage Storefront Specification: [`docs/superpowers/specs/2026-10-15-multipage-client-storefront.md`](docs/superpowers/specs/2026-10-15-multipage-client-storefront.md)
  - Multipage Storefront Execution Plan: [`docs/superpowers/plans/2026-10-15-multipage-client-storefront.md`](docs/superpowers/plans/2026-10-15-multipage-client-storefront.md)

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── web/                     # Primary Next.js 15 App Router web application
│   │   ├── src/app/             # Marketing routes, dashboard, customer storefronts (/s/[slug])
│   │   ├── src/lib/             # Auth, Supabase client/server, Razorpay, formatters, validation
│   │   ├── public/              # Sector template preview artwork, PWA icons, assets
│   │   └── package.json
│   └── marketing/               # Standalone static marketing site and builder preview
├── sites/                       # Audits and databases for 700 benchmark sites across 14 genres
├── files/                       # Top 100 hero and scroll UI combinations
├── docs/                        # SRS feasibility reports, architecture plans, and audits
├── flowchart/                   # Mermaid architecture pipeline diagram
├── supabase/                    # 13 SQL migrations, config, and pgTAP database tests
├── package.json                 # Monorepo root scripts (Turbo, Prettier, TypeScript)
├── pnpm-workspace.yaml          # pnpm workspace configuration
└── turbo.json                   # Turbo build and pipeline caching configuration
```

---

## 🚀 Getting Started & Developer Guide

### Prerequisites
- Node.js `>= 20.0.0`
- pnpm `>= 9.15.0`
- A free or paid [Supabase](https://supabase.com) project

### 1. Installation
Clone the repository and install all monorepo dependencies:
```bash
git clone https://github.com/j7452479-a11y/app.git
cd app
pnpm install
```

### 2. Configure Environment
Copy the example environment configuration into the web app:
```bash
cp apps/web/.env.example apps/web/.env.local
```
Fill in your Supabase connection parameters and encryption key:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYMENT_CREDENTIALS_ENCRYPTION_KEY=your-base64-32byte-encryption-key
```

### 3. Apply Database Migrations
Execute the SQL files in `supabase/migrations/` sequentially using the Supabase Dashboard SQL Editor or via the Supabase CLI:
```bash
supabase db push
```

### 4. Run Development Server
```bash
pnpm --filter @commerce-os/web dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests & Quality Verification
```bash
# Run unit & integration tests (Vitest - 76 tests)
pnpm --filter @commerce-os/web test

# Run TypeScript typechecks
pnpm --filter @commerce-os/web typecheck

# Run production build
pnpm --filter @commerce-os/web build
```

---

## ⚖️ Operational Limits & Launch Readiness

Before launching to live paying merchants:
- **Custom Domains:** Domain resolution integrates with Vercel's Domain API and fails closed for unverified records. Production deployment requires valid `VERCEL_TOKEN` and `VERCEL_PROJECT_ID`.
- **Payment Keys:** Do not run production transactions using test Razorpay keys. Validate webhooks at `https://YOUR_DOMAIN/api/webhooks/razorpay` and `https://YOUR_DOMAIN/api/webhooks/store-payment`.
- **Email Delivery:** Configure Resend with `RESEND_API_KEY` and `EMAIL_FROM` to send automated order receipts. Configure custom SMTP in Supabase Auth for transactional emails.
- **Legal Review:** Privacy notice (`/privacy`) and service terms (`/terms`) must be customized with your operating legal entity, registered address, and Indian counsel approval before onboarding live customers.

---

<div align="center">
  <sub>Built with care for independent commerce across India.</sub>
</div>
