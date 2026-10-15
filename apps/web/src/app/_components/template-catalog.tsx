"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { storefrontTemplates } from "@/lib/storefront-templates";

const categoryById: Record<string, string> = {
  essential: "Retail", fashion: "Fashion", beauty: "Beauty", electronics: "Retail", home: "Home", grocery: "Food", food: "Food", artisan: "Fashion", luxury: "Fashion", local: "Services", b2b: "Business", subscription: "Retail", services: "Services", marketplace: "Retail",
};
const categories = ["All", "Retail", "Fashion", "Beauty", "Home", "Food", "Business", "Services"];

export function TemplateCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("recommended");
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = storefrontTemplates.filter((template) => (category === "All" || categoryById[template.id] === category) && (!normalized || `${template.name} ${template.tone} ${template.eyebrow} ${categoryById[template.id]}`.toLowerCase().includes(normalized)));
    return sort === "az" ? [...filtered].sort((a, b) => a.name.localeCompare(b.name)) : filtered;
  }, [query, category, sort]);

  return <section className="catalog-content" aria-label="Storefront templates">
    <div className="catalog-tools"><label className="catalog-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by business or style" aria-label="Search templates"/></label><label className="catalog-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="az">Name A–Z</option></select></label></div>
    <div className="catalog-filters" role="group" aria-label="Filter by sector">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "selected" : ""} aria-pressed={category === item}>{item}</button>)}</div>
    <div className="catalog-result-count">{results.length} storefront directions <span>·</span> your brand and products stay yours</div>
    {results.length ? <div className="template-gallery">{results.map((template, index) => <article className="template-card" key={template.id}>
      <div className={`template-thumb template-photo archetype-${template.id}`}><img src={template.image} alt={`${template.name} storefront design preview`} loading="lazy"/><span className="template-photo-label">{template.name}</span><span className="template-index">{String(storefrontTemplates.findIndex((item) => item.id === template.id) + 1).padStart(2,"0")}</span></div>
      <div className="template-info"><div><span className="catalog-category">{categoryById[template.id]}</span><h2>{template.name}</h2><p>{template.tone}</p></div><Link className="button secondary small" href={`/sign-up?template=${template.id}`}>Choose this look <ArrowUpRight size={13}/></Link></div>
    </article>)}</div> : <div className="catalog-empty"><strong>No matching storefronts</strong><span>Try another search or clear the sector filter.</span><button onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}
  </section>;
}
