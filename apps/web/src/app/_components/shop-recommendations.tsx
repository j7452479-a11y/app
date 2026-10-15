"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

type Product = { id: string; name: string; description: string; price_paise: number };
export function ShopRecommendations({ slug, products }: { slug: string; products: Product[] }) {
  const [need, setNeed] = useState(""); const [result, setResult] = useState<{ intro: string; ids: string[] } | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function ask(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); const response = await fetch("/api/store-recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, need }) }); const data = await response.json() as { intro?: string; ids?: string[]; error?: string }; if (!response.ok) setError(data.error || "Recommendations are unavailable."); else setResult({ intro: data.intro || "", ids: data.ids || [] }); setBusy(false); }
  const selected = products.filter((product) => result?.ids.includes(product.id));
  return <section className="sf-recommendations"><div><p className="sf-eyebrow">PRO SHOPPING HELP</p><h2>Find something that fits.</h2><p>Tell us what you need. The shop assistant suggests items from this catalogue only.</p></div><form onSubmit={ask}><label htmlFor="shopping-need">What are you looking for?</label><div><input id="shopping-need" value={need} onChange={(event) => setNeed(event.target.value)} minLength={3} maxLength={280} placeholder="For example: a small gift under ₹2,000"/><button className="sf-cta" disabled={busy}>{busy ? "Finding options…" : <><Sparkles size={15}/> Find products</>}</button></div>{error && <p role="alert" className="chat-error">{error}</p>}{result && <div className="recommendation-answer"><p>{result.intro}</p>{selected.map((product) => <a href="#products" key={product.id}><b>{product.name}</b><span>₹{(product.price_paise / 100).toLocaleString("en-IN")}</span></a>)}</div>}</form></section>;
}
