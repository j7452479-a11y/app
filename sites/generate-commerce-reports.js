const fs = require('fs');
const path = require('path');
const root = __dirname;
const sites = JSON.parse(fs.readFileSync(path.join(root, 'all-sites-database.json'), 'utf8'));
const categories = [
  ['discovery', /search|navigation|category|taxonomy|lookbook|collection|editorial|story|moodboard|locator|directory|quiz|diagnostic|finder|recommend/i],
  ['filtering', /filter|sort|faceted|swatch|shade|size|fit|compatibility|selector|toggle|comparison|compare|matrix/i],
  ['configuration', /builder|configur|custom|personal|modifier|add-on|bundle|pack|starter|routine|kit|variant|monogram|engraving|model|finish|flavor|scent/i],
  ['product-information', /spec|dimension|material|ingredient|clinical|technical|warranty|guarantee|compatib|certif|provenance|origin|care|trial|badge|disclosure|diagram|chart|datasheet|guide/i],
  ['media-storytelling', /video|photograph|imagery|lookbook|visual|zoom|360|3d|interactive|tutorial|campaign|runway|workshop|story/i],
  ['availability-fulfillment', /stock|inventory|availability|shipping|delivery|pickup|lead time|timeline|batch|pre-order|waitlist|store|in-store|radius|slot/i],
  ['cart-checkout', /cart|checkout|payment|express|buy|purchase|order|replenish|recurring|subscription|slide-out|step-through/i],
  ['trust-community', /review|community|giving|impact|social|sustainab|ethical|repair|verified|seal|pledge|transparen/i],
  ['account-retention', /account|member|loyalty|renewal|refill|recurrent|repeat|pause|save|subscription|registration/i],
  ['mobile-performance', /mobile|responsive|fast|lightning|quick|swift|seamless|frictionless|high-speed/i]
];
const genreProfiles = {
  'Essential Commerce': 'search-led catalog, neutral grid, quick cart, product variants, express checkout',
  'Fashion Atelier': 'campaign and lookbook discovery, size/fit guidance, swatches, styling content, limited drops',
  'Beauty Studio': 'concern/routine discovery, shade matching, ingredient transparency, clinical proof, regimen builders',
  'Electronics Grid': 'spec-first search, compatibility filters, comparison tables, configurators, warranty and stock signals',
  'Home and Furniture': 'room/context imagery, dimensions, materials, modular configuration, delivery and lead-time clarity',
  'Grocery and Daily Needs': 'dense taxonomy, availability, quantity steppers, repeat purchase, delivery slots and substitutions',
  'Food and Restaurant Shop': 'menu discovery, modifiers, dietary/allergen information, pickup/delivery timing, order tracking',
  'Artisan Market': 'maker stories, provenance, process media, batch/made-to-order data, transparent lead times',
  'Premium Luxury': 'editorial collection browsing, concierge/advisor pathways, appointments, authenticity and heritage content',
  'Local Business': 'location-first information, hours, store locator, contact actions, local fulfillment and events',
  'B2B Catalog': 'technical search, datasheets, bulk pricing, account terms, RFQ and procurement workflows',
  'Subscription Products': 'one-time vs recurring choice, cadence economics, renewal controls, pause/skip, refill/replenishment',
  'Professional Services': 'service outcomes, case evidence, scope/investment clarity, intake, scheduling and consultation',
  'Modern Marketplace Style': 'search-dominant taxonomy, facets, comparison, recommendations, dense catalog and quick purchase'
};
const byGenre = new Map();
for (const site of sites) {
  if (!byGenre.has(site.genre_id)) byGenre.set(site.genre_id, { id: site.genre_id, name: site.genre_name, sites: [] });
  byGenre.get(site.genre_id).sites.push(site);
}
function extract(site) {
  const text = `${site.primary_specialty}. ${site.key_highlights}`;
  return { genre_id: site.genre_id, genre: site.genre_name, rank: site.rank, name: site.name, url: site.url, specialty: site.primary_specialty, source_highlights: site.key_highlights, extracted_feature_categories: categories.filter(([, re]) => re.test(text)).map(([name]) => name) };
}
const records = sites.map(extract);
const counts = {};
for (const record of records) for (const category of record.extracted_feature_categories) counts[category] = (counts[category] || 0) + 1;
const output = { generated_from: 'all-sites-database.json', site_count: records.length, genre_count: byGenre.size, extraction_method: 'Keyword-assisted categorization of primary_specialty and key_highlights; source text retained for verification.', category_counts: counts, sites: records };
fs.writeFileSync(path.join(root, 'ecommerce-features-extraction.json'), JSON.stringify(output, null, 2));
const esc = value => String(value).replace(/[&<>\"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const safeUrl = value => { try { const u = new URL(value); return (u.protocol === 'http:' || u.protocol === 'https:') ? value : null; } catch { return null; } };
const link = (url, name) => { const s = safeUrl(url); return s ? `<a href="${esc(s)}" rel="noopener noreferrer">${esc(name)}</a>` : esc(name); };
const cards = Object.entries(counts).sort((a,b) => b[1] - a[1]).map(([key, count]) => `<article class="card"><h3>${esc(key)}</h3><p><b>${count}</b> of ${sites.length} sites (${(count / sites.length * 100).toFixed(1)}%)</p><p class="muted">A pattern signal, not a universal requirement.</p></article>`).join('');
const profiles = [...byGenre.values()].sort((a,b) => a.id - b.id).map(g => `<article class="card"><h3>${String(g.id).padStart(2, '0')} · ${esc(g.name)}</h3><p class="muted">${esc(genreProfiles[g.name])}</p><div class="tags">${[...new Set(g.sites.flatMap(s => extract(s).extracted_feature_categories))].map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div></article>`).join('');
const rows = records.map(r => `<tr><td>${esc(r.genre)}</td><td>${link(r.url, r.name)}</td><td>${esc(r.specialty)}</td><td>${r.extracted_feature_categories.map(x => `<span class="tag">${esc(x)}</span>`).join(' ')}</td><td>${esc(r.source_highlights)}</td></tr>`).join('');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Commerce Feature Atlas</title><style>:root{--bg:#f7f7f4;--surface:#fff;--ink:#182027;--muted:#657078;--line:#d8dedb;--accent:#1b6e65;--accent-soft:#e7f2ef}@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#101617;--surface:#182022;--ink:#edf5f1;--muted:#a6b6b0;--line:#344340;--accent:#6fd0be;--accent-soft:#17342f}}:root[data-theme="dark"]{--bg:#101617;--surface:#182022;--ink:#edf5f1;--muted:#a6b6b0;--line:#344340;--accent:#6fd0be;--accent-soft:#17342f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:42px 24px}h1,h2,h3{font-family:Georgia,serif;font-weight:400;line-height:1.15}h1{font-size:clamp(2.1rem,5vw,4.4rem);max-width:760px;margin:0 0 12px}h2{font-size:1.8rem;margin:42px 0 12px}.dek{max-width:720px;color:var(--muted);font-size:1.05rem}.stats{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}.stat{background:var(--surface);border:1px solid var(--line);padding:12px 16px;border-radius:8px}.stat b{display:block;font-size:1.5rem;color:var(--accent)}.stat span{color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.06em}.callout{background:var(--accent-soft);border-left:4px solid var(--accent);padding:16px 18px;margin:22px 0}.table-wrap{overflow-x:auto}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px}.card h3{font-size:1.15rem;margin:0 0 8px}.muted{color:var(--muted)}.tags{display:flex;flex-wrap:wrap;gap:6px}.tag{background:var(--accent-soft);color:var(--accent);padding:4px 8px;border-radius:999px;font-size:.75rem}table{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--line)}th,td{text-align:left;vertical-align:top;padding:10px 12px;border-bottom:1px solid var(--line)}th{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}td:first-child{white-space:nowrap;font-weight:600}footer{color:var(--muted);margin-top:36px;font-size:.85rem}</style></head><body><main><p class="muted">BENCHMARK FEATURE EXTRACTION · 2026-10</p><h1>Commerce Feature Atlas</h1><p class="dek">A traceable feature inventory for all ${sites.length} benchmark sites across ${byGenre.size} commerce genres. Each record preserves its supplied highlight and adds normalized categories for product, discovery, trust, fulfillment, and retention decisions.</p><div class="stats"><div class="stat"><b>${sites.length}</b><span>Sites analyzed</span></div><div class="stat"><b>${byGenre.size}</b><span>Genres</span></div><div class="stat"><b>${Object.keys(counts).length}</b><span>Feature categories</span></div><div class="stat"><b>50</b><span>Sites / genre</span></div></div><div class="callout"><b>Method:</b> Categories are keyword-assisted summaries of the supplied <code>primary_specialty</code> and <code>key_highlights</code> fields. The source text remains on every record so implementation teams can verify a classification before treating it as a requirement.</div><h2>Feature category coverage</h2><div class="grid">${cards}</div><h2>Genre feature profiles</h2><div class="grid">${profiles}</div><h2>Site-level extraction</h2><div class="table-wrap"><table><thead><tr><th>Genre</th><th>Site</th><th>Specialty</th><th>Extracted categories</th><th>Source highlight</th></tr></thead><tbody>${rows}</tbody></table></div><footer>Source: all-sites-database.json. Benchmark references are used as UX pattern research; do not copy brand assets, layouts, or copy.</footer></main></body></html>`;
fs.writeFileSync(path.join(root, 'ecommerce-features-database.html'), html);
console.log(`Generated ${records.length} site records across ${byGenre.size} genres.`);
