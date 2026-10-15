import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/app/_components/marketing-header";
import { storefrontTemplates } from "@/lib/storefront-templates";

const groups = [
  { label: "(A) PRODUCT RETAIL", title: "A considered shelf for every kind of product.", ids: ["essential", "fashion", "beauty", "electronics", "home", "grocery", "artisan", "luxury", "subscription", "marketplace"], description: "Clear product pages, a browsable catalogue, checkout, and order management. Pick the visual direction that makes sense for your assortment." },
  { label: "(B) FOOD & LOCAL", title: "Make the next order feel easy.", ids: ["food", "local"], description: "Menu- and place-led storefronts give customers a direct path to browse products and place an order. Advanced table booking and delivery dispatch are not included." },
  { label: "(C) BUSINESS & SERVICES", title: "Lead with the work you do best.", ids: ["b2b", "services"], description: "A stronger starting point for specification-led catalogues and service inquiries. Quote workflows, recurring subscriptions, and appointment scheduling require additional implementation." },
];

export default function SolutionsPage() {
  return <main className="marketing-site"><MarketingHeader/><section className="catalog-intro"><p className="eyebrow">(A) SOLUTIONS BY SECTOR</p><h1>Made to fit the<br/><em>way you do business.</em></h1><p>Start from a sector-specific storefront direction, then use the same core Commerce OS catalogue, checkout, order, and billing tools.</p></section><section className="solutions-groups">{groups.map((group) => <article className="solution-group" key={group.label}><div className="solution-copy"><p className="eyebrow">{group.label}</p><h2>{group.title}</h2><p>{group.description}</p><Link className="text-link" href="/templates">Explore these storefronts <ArrowRight size={14}/></Link></div><div className="solution-chips">{group.ids.map((id) => { const template = storefrontTemplates.find((item) => item.id === id)!; return <Link key={id} href={`/sign-up?template=${id}`} className={`solution-chip archetype-${id}`}><span>{template.name}</span><small>{template.tone}</small><ArrowRight size={15}/></Link>; })}</div></article>)}</section><section className="market-last-call"><p className="eyebrow">SAME CORE. YOUR KIND OF SHOP.</p><h2>Choose your starting point.<br/>We’ll help you shape the storefront.</h2><Link className="button" href="/templates">Browse all templates <ArrowRight size={15}/></Link></section><MarketingFooter/></main>;
}
