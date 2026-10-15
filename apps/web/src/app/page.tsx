import Link from "next/link";
import { ArrowDownRight, ArrowRight, Check } from "lucide-react";
import { MarketingHeader, MarketingFooter } from "@/app/_components/marketing-header";
import { createClient } from "@/lib/supabase/server";
import { storefrontTemplates } from "@/lib/storefront-templates";

export default async function Home() {
  let dashboardHref = "/sign-in";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) dashboardHref = "/dashboard";
  } catch {}
  const featured = [storefrontTemplates[0], storefrontTemplates[1], storefrontTemplates[6], storefrontTemplates[10]];
  return (
    <main className="marketing-site">
      {/* Features: template discovery, sector search, managed storefront plans, merchant operations — Source: ecommerce-features-extraction.json, Modern Marketplace Style */}
      <MarketingHeader dashboardHref={dashboardHref}/>
      <section className="market-hero">
        <div className="market-hero-copy">
          <p className="eyebrow">(A) YOUR SHOP, READY TO GO</p>
          <h1>A storefront<br/>that feels like<br/><em>your business.</em></h1>
          <p className="market-lede">We build and look after your online shop—products, orders, payments and a real person to help you get it live.</p>
          <div className="market-cta-row"><Link className="button hero-button" href="/templates">Find your storefront <ArrowRight size={16}/></Link><Link className="text-link" href="/solutions">See what fits your business <ArrowDownRight size={15}/></Link></div>
          <div className="market-proof"><span>14 sector starting points</span><span>First month free after publish</span><span>Plans from ₹5,000 / month</span></div>
        </div>
        <div className="market-hero-visual" aria-label="Example Commerce OS storefront previews">
          <div className="hero-preview preview-back"><div className="preview-chrome"><i/><i/><i/><span>YOUR BRAND / SHOP</span></div><div className="preview-art preview-art-two"/><b>Good things,<br/>well chosen.</b><small>SHOP THE COLLECTION ↗</small></div>
          <div className="hero-preview preview-front"><div className="preview-chrome"><i/><i/><i/><span>MADE WITH CARE</span></div><div className="preview-art preview-art-one"/><b>Objects for<br/>everyday life.</b><small>DISCOVER THE STUDIO ↗</small></div>
          <span className="hero-stamp">14<br/><small>WAYS TO<br/>BEGIN</small></span>
        </div>
      </section>

      <section className="market-section shelf-section" id="templates">
        <div className="market-section-head"><div><p className="eyebrow">(B) THE TEMPLATE SHELF</p><h2>Start with the way<br/>your customers shop.</h2></div><div><p>Fourteen storefront directions, shaped around different kinds of businesses. Choose a starting point; keep your own brand and products.</p><Link className="text-link" href="/templates">Browse all 14 templates <ArrowRight size={14}/></Link></div></div>
        <div className="featured-shelf">{featured.map((template, index) => <Link className={`featured-template archetype-${template.id}`} href={`/sign-up?template=${template.id}`} key={template.id}><div className="featured-template-preview"><div className="preview-chrome"><i/><i/><i/><span>{template.name.toUpperCase()}</span></div><div className="featured-art"><img src={template.image} alt={`${template.name} storefront preview`} loading="lazy"/></div><div className="featured-copy"><small>{template.eyebrow}</small><b>{template.headline.split("\n").join(" ")}</b><span>{template.collection} ↗</span></div></div><div className="featured-template-info"><div><small>{String(index + 1).padStart(2,"0")} / {template.name}</small><p>{template.tone}</p></div><ArrowRight size={17}/></div></Link>)}</div>
      </section>

      <section className="market-steps">
        <div className="market-section-head"><div><p className="eyebrow">(C) HOW IT WORKS</p><h2>From first idea<br/>to first order.</h2></div><p>Pick a look, set up your shop, and publish when it’s ready. The trial starts on that first publish—not while you’re still building.</p></div>
        <div className="steps-list"><article><span>01</span><div><h3>Choose a direction</h3><p>Start with one of 14 layouts inspired by how retail, food, services and other sectors work.</p></div><Link href="/templates">Browse the shelf ↗</Link></article><article><span>02</span><div><h3>Make it your own</h3><p>Add your details and products. Our team handles the store setup and your included revisions.</p></div><Link href="/solutions">Explore sectors ↗</Link></article><article><span>03</span><div><h3>Publish when ready</h3><p>Your 30-day trial begins when the storefront is first published. You stay in control of launch.</p></div><Link href="/sign-up">Start setup ↗</Link></article></div>
      </section>

      <section id="plans" className="market-section pricing-section"><div className="market-section-head"><div><p className="eyebrow">(D) STRAIGHTFORWARD MONTHLY PLANS</p><h2>Pay for the support<br/>you actually need.</h2></div><p>All plans include a managed storefront and commerce workspace. No visitor-facing recommendations or ad modules.</p></div>
        <div className="pricing-shelf"><article className="plan-card"><span className="eyebrow">01 / ONE WEBSITE</span><h3>Basic</h3><div className="plan-price">₹5,000<small> / month after month one</small></div><p>For one business website and its daily operations.</p><ul><li>1 website</li><li>Storefront, products and orders</li><li>1 design revision</li><li>COD or connected payments</li><li>No AI or campaign requests</li></ul><Link className="button secondary" href="/sign-up">Choose Basic <ArrowRight size={14}/></Link></article>
          <article className="plan-card featured-plan"><span className="eyebrow">02 / THREE WEBSITES</span><h3>Plus</h3><div className="plan-price">₹15,000<small> / month after month one</small></div><p>For a growing business with several storefronts.</p><ul><li>Up to 3 websites</li><li>Everything in Basic</li><li>3 design revisions</li><li>4 campaign creative requests / month</li><li>Basic single-turn AI support</li></ul><Link className="button" href="/sign-up">Choose Plus <ArrowRight size={14}/></Link></article>
          <article className="plan-card"><span className="eyebrow">03 / FIVE WEBSITES</span><h3>Pro</h3><div className="plan-price">₹20,000<small> / month after month one</small></div><p>For operators managing a portfolio of stores.</p><ul><li>Up to 5 websites</li><li>Everything in Plus</li><li>5 design revisions</li><li>10 campaign creative requests / month</li><li>Installable store app + AI shopping help</li></ul><Link className="button secondary" href="/sign-up">Choose Pro <ArrowRight size={14}/></Link></article></div>
        <p className="pricing-note">The first month is free from first publication. Payment failure locks the merchant dashboard; storefront restrictions follow after 3 days, and the domain is taken down after 10 days of non-payment. Multi-website limits are shown as your plan entitlement; multi-store provisioning and isolation still need database implementation before those higher limits can be sold.</p>
      </section>

      <section className="market-last-call"><p className="eyebrow">A GOOD PLACE TO START</p><h2>Your business has its own way of doing things.<br/>Your website should, too.</h2><Link className="button" href="/start">Set up your shop <ArrowRight size={15}/></Link><div className="trust-row"><span><Check size={14}/> Publish when ready</span><span><Check size={14}/> Your products, your brand</span><span><Check size={14}/> Revisions included by plan</span></div></section>
      <MarketingFooter/>
    </main>
  );
}
