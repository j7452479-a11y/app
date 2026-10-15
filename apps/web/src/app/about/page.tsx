import Link from "next/link";
import { ArrowRight, Check, Compass, Layers, ShieldCheck, Sparkles, Store } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/app/_components/marketing-header";
import { storefrontTemplates } from "@/lib/storefront-templates";

export const metadata = {
  title: "About & Reading Room — Commerce OS",
  description: "Read the philosophy, architectural principles, and 14 sector archetypes behind Commerce OS — independent multi-tenant commerce for Indian businesses.",
};

export default function AboutPage() {
  return (
    <main className="marketing-site">
      <MarketingHeader />

      {/* Hero / Introduction */}
      <section className="catalog-intro" style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 40px" }}>
        <p className="eyebrow">(A) THE READING ROOM & MANIFESTO</p>
        <h1 style={{ fontSize: "clamp(38px, 5.5vw, 68px)", lineHeight: 1.05, letterSpacing: "-0.05em", marginBottom: 24 }}>
          Commerce that feels like<br />
          <em>your actual business.</em>
        </h1>
        <p style={{ fontSize: "clamp(16px, 1.8vw, 20px)", lineHeight: 1.6, color: "#605d56", maxWidth: 680 }}>
          For decades, digital commerce platforms forced every merchant into the exact same cookie-cutter template. A boutique fashion atelier was treated identically to an industrial bolt supplier, a neighborhood bakery, and a luxury horologist. Commerce OS was engineered to change that.
        </p>
      </section>

      {/* Core Thesis / The Problem */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "20px 24px 60px" }}>
        <article style={{ background: "#ffffff", border: "1px solid #e8e5df", borderRadius: 8, padding: "clamp(24px, 4vw, 48px)", marginBottom: 40 }}>
          <p className="eyebrow" style={{ color: "#a64a32" }}>01 / THE CORE THESIS</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.04em", marginBottom: 18, color: "#26251f" }}>
            Why one-size-fits-all software fails independent merchants
          </h2>
          <div style={{ color: "#45433e", lineHeight: 1.8, fontSize: 16, display: "grid", gap: 16 }}>
            <p>
              When a customer walks into a fine bakery, they follow their nose and look at fresh morning batches. When they visit an electronics wholesaler, they care about spec sheets, warranty policies, and tiered bulk volume pricing. When they browse handcrafted brassware, they want to understand the artisan behind the casting and the heritage of the workshop.
            </p>
            <p>
              Mainstream commerce platforms reduce all of these nuanced buying behaviors into an identical 4-column grid, a generic cart, and a cold checkout form. Independent Indian businesses lose their voice, their trust badges, and their distinct customer connection.
            </p>
            <p>
              <strong>Commerce OS replaces that uniformity with 14 intentional sector archetypes</strong>—grounded in research across 700 category-leading benchmark websites and calibrated specifically for the Indian commerce ecosystem.
            </p>
          </div>
        </article>

        {/* 14 Sector Directory */}
        <article style={{ background: "#ffffff", border: "1px solid #e8e5df", borderRadius: 8, padding: "clamp(24px, 4vw, 48px)", marginBottom: 40 }}>
          <p className="eyebrow" style={{ color: "#a64a32" }}>02 / THE 14 SECTOR ARCHETYPES</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.04em", marginBottom: 18, color: "#26251f" }}>
            Fourteen distinct ways to connect with customers
          </h2>
          <p style={{ color: "#605d56", marginBottom: 28, lineHeight: 1.7 }}>
            Every archetype features customized typography, information hierarchy, layout density, product presentation, and motion dynamics crafted specifically for its trade:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {storefrontTemplates.map((template, idx) => (
              <Link
                key={template.id}
                href={`/templates`}
                style={{
                  display: "block",
                  padding: "16px",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.15s ease",
                  background: "#faf9f6"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <small style={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, color: "#a64a32" }}>
                    {String(idx + 1).padStart(2, "0")} / {template.id.toUpperCase()}
                  </small>
                  <ArrowRight size={13} color="#827d73" />
                </div>
                <strong style={{ display: "block", fontSize: 16, marginBottom: 4, color: "#26251f" }}>
                  {template.name}
                </strong>
                <p style={{ margin: 0, fontSize: 13, color: "#605d56", lineHeight: 1.5 }}>
                  {template.tone}
                </p>
              </Link>
            ))}
          </div>
        </article>

        {/* Multi-Page Storefront Architecture */}
        <article style={{ background: "#ffffff", border: "1px solid #e8e5df", borderRadius: 8, padding: "clamp(24px, 4vw, 48px)", marginBottom: 40 }}>
          <p className="eyebrow" style={{ color: "#a64a32" }}>03 / MULTI-PAGE ARCHITECTURE</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.04em", marginBottom: 18, color: "#26251f" }}>
            A credible, complete web presence—not a single-page flyer
          </h2>
          <p style={{ color: "#605d56", marginBottom: 24, lineHeight: 1.7 }}>
            Customers do not buy from stores that look ephemeral. Commerce OS equips every merchant with structured, server-rendered multi-page routes protected by strict draft/live publication controls:
          </p>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              { route: "/s/[slug]", name: "Home Route", desc: "Sector-specific hero, featured shelf, brand narrative, and clear navigation paths." },
              { route: "/s/[slug]/shop", name: "Full Shop & Catalog", desc: "Browsing with search, real-time stock filtering, and price/name sorting." },
              { route: "/s/[slug]/products/[productSlug]", name: "Stable Product Pages", desc: "High-resolution imagery, readable collision-resistant slugs, and direct cart actions." },
              { route: "/s/[slug]/about", name: "Merchant Story", desc: "Authentic founding story, studio photos, and creator origins. No generic filler copy." },
              { route: "/s/[slug]/contact", name: "Direct Contact & Hours", desc: "Verified phone, email, physical address or service area, and operating hours." },
              { route: "/s/[slug]/faq", name: "Customer FAQ", desc: "Merchant-authored questions and transparent answers about products and care." },
              { route: "/s/[slug]/policies/shipping-returns", name: "Shipping & Returns Policy", desc: "Transparent delivery timelines, shipping charges, and verified return/refund terms." },
              { route: "/s/[slug]/orders/track", name: "Capability Order Tracking", desc: "Token-authorized order status lookup (Plus/Pro) without exposing other customer records." },
            ].map((item) => (
              <div key={item.route} style={{ display: "flex", gap: 16, padding: "12px 14px", borderBottom: "1px solid #f0ede8" }}>
                <code style={{ fontSize: 13, background: "#f0ede8", padding: "2px 8px", borderRadius: 4, height: "fit-content", color: "#26251f" }}>
                  {item.route}
                </code>
                <div>
                  <strong style={{ display: "block", fontSize: 14, color: "#26251f" }}>{item.name}</strong>
                  <span style={{ fontSize: 13, color: "#605d56" }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Engineering Craft & Security */}
        <article style={{ background: "#ffffff", border: "1px solid #e8e5df", borderRadius: 8, padding: "clamp(24px, 4vw, 48px)", marginBottom: 40 }}>
          <p className="eyebrow" style={{ color: "#a64a32" }}>04 / TECHNICAL CRAFT & SECURITY</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.04em", marginBottom: 18, color: "#26251f" }}>
            Engineered for performance, privacy, and peace of mind
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#26251f" }}>
                <Layers size={18} color="#a64a32" />
                <strong>Next.js 15 & React 19</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#605d56", lineHeight: 1.6 }}>
                Sub-second server rendering, edge caching, and zero client-side hydration waterfalls.
              </p>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#26251f" }}>
                <ShieldCheck size={18} color="#a64a32" />
                <strong>Supabase RLS & Dual Keys</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#605d56", lineHeight: 1.6 }}>
                PostgreSQL Row Level Security ensures strict tenant isolation. Merchant Razorpay secrets are AES-256-GCM encrypted.
              </p>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#26251f" }}>
                <Store size={18} color="#a64a32" />
                <strong>Pro Installable PWA</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#605d56", lineHeight: 1.6 }}>
                A full-screen, native-feeling mobile app experience right from the browser with per-tenant webmanifests.
              </p>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#26251f" }}>
                <Sparkles size={18} color="#a64a32" />
                <strong>Tightly Guarded AI</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#605d56", lineHeight: 1.6 }}>
                AI operations are strictly bounded: single-turn assistant support without dangerous write privileges.
              </p>
            </div>
          </div>
        </article>

        {/* Transparent Business Terms */}
        <article style={{ background: "#ffffff", border: "1px solid #e8e5df", borderRadius: 8, padding: "clamp(24px, 4vw, 48px)" }}>
          <p className="eyebrow" style={{ color: "#a64a32" }}>05 / PRICING & PROMISE</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.04em", marginBottom: 18, color: "#26251f" }}>
            Honest plans with trial starting on first publish
          </h2>
          <div style={{ color: "#45433e", lineHeight: 1.8, fontSize: 16, display: "grid", gap: 16 }}>
            <p>
              We believe you should not pay for software while you are still setting it up. That is why your <strong>30-day free trial starts only on your first store publication</strong>, not during catalogue building.
            </p>
            <p>
              Our monthly plans (<strong>Basic ₹5,000</strong>, <strong>Plus ₹15,000</strong>, and <strong>Pro ₹20,000</strong>) include real design revisions by our team, managed campaign creatives, order-scoped customer messaging with photo/voice attachments, and continuous maintenance.
            </p>
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link className="button" href="/start">
              Start your store <ArrowRight size={15} />
            </Link>
            <Link className="button secondary" href="/templates">
              Browse the 14 Templates
            </Link>
          </div>
        </article>
      </section>

      {/* Call to action */}
      <section className="market-last-call">
        <p className="eyebrow">READY TO BUILD SOMETHING CREDIBLE?</p>
        <h2>Your store should look like you built it with pride.</h2>
        <Link className="button" href="/start">
          Get started with Commerce OS <ArrowRight size={15} />
        </Link>
        <div className="trust-row">
          <span><Check size={14} /> Month one free on publish</span>
          <span><Check size={14} /> 14 authentic sector designs</span>
          <span><Check size={14} /> Design revisions included</span>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
