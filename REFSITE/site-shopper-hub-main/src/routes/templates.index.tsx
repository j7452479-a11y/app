import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { TemplateCard } from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";
import { categories, templates, type Category } from "@/data/templates";

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "All website templates — Commerce OS" },
      {
        name: "description",
        content:
          "Browse every ready-to-launch website in the catalog. Filter by category, sort by price or rating, and add to cart.",
      },
      { property: "og:title", content: "All website templates — Commerce OS" },
      {
        property: "og:description",
        content: "Filter by category, sort by price or rating, and add a site to your cart.",
      },
    ],
  }),
  component: TemplatesPage,
});

type Sort = "price-asc" | "price-desc" | "rating";

function TemplatesPage() {
  const [category, setCategory] = useState<Category | "All">("All");
  const [sort, setSort] = useState<Sort>("price-asc");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates
      .filter((t) => (category === "All" ? true : t.category === category))
      .filter(
        (t) =>
          q === "" ||
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.tagline.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sort === "price-asc"
          ? a.price - b.price
          : sort === "price-desc"
            ? b.price - a.price
            : b.rating - a.rating,
      );
  }, [category, sort, query]);

  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionMarker>(b) Catalog</SectionMarker>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Website templates</h1>
        <p className="mt-2 max-w-[46ch] text-muted-foreground">
          Fourteen sectors. Find the right starting point for your business.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-b border-border pb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            className="field max-w-56"
          />
          <select value={category} onChange={e => setCategory(e.target.value as Category | "All")} aria-label="Filter by sector" className="field max-w-56"><option value="All">All sectors</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort templates"
            className="field ml-auto max-w-48"
          >
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Recommended</option>
          </select>
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-subtle">
          {visible.length} {visible.length === 1 ? "template" : "templates"}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((t) => (
            <TemplateCard key={t.slug} template={t} />
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="panel mt-6 p-8 text-center">
            <p className="text-sm font-semibold">Nothing in the catalog matches that.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different word or clear the filters.
            </p><Button variant="outline" className="mt-4" onClick={() => { setCategory("All"); setQuery(""); }}>Clear filters</Button>
          </div>
        ) : null}
      </section>
    </StorePage>
  );
}
