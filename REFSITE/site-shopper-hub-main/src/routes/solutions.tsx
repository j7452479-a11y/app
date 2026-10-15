import { createFileRoute, Link } from "@tanstack/react-router";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { templates } from "@/data/templates";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Solutions by business type — Commerce OS" },
      {
        name: "description",
        content:
          "Retail, restaurants, services, bookings, and quotes: see which ready-made website fits the way your business works.",
      },
      { property: "og:title", content: "Solutions by business type — Commerce OS" },
      {
        property: "og:description",
        content: "See which ready-made website fits the way your business works.",
      },
    ],
  }),
  component: SolutionsPage,
});

const solutions = templates.map(t => ({ title: t.category, slug: t.slug, body: t.tagline, jobs: t.includes }));

function SolutionsPage() {
  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionMarker>Solutions</SectionMarker>
        <h1 className="mt-3 max-w-[20ch] text-4xl font-extrabold tracking-tight">
          Pick the shape of your business.
        </h1>
        <p className="mt-2 max-w-[52ch] text-muted-foreground">
          Each one comes with a recommended template and the day-to-day jobs already set up.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {solutions.map((s) => {
            const template = templates.find((t) => t.slug === s.slug);
            if (!template) return null;
            return (
              <div key={s.title} className="panel overflow-hidden">
                <img
                  src={template.image}
                  alt={`${template.name} template preview`}
                  loading="lazy"
                  width={1280}
                  height={800}
                  className="aspect-[16/9] w-full bg-muted object-cover"
                />
                <div className="p-6">
                  <h2 className="text-2xl font-extrabold tracking-tight">{s.title}</h2>
                  <p className="mt-2 max-w-[46ch] text-sm text-muted-foreground">{s.body}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {s.jobs.map((j) => (
                      <li
                        key={j}
                        className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                      >
                        {j}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to="/templates/$slug"
                      params={{ slug: s.slug }}
                      className="btn btn-primary btn-sm"
                    >
                      See {template.name}
                    </Link>
                    <Link to="/templates" className="btn btn-secondary btn-sm">
                      Compare all
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </StorePage>
  );
}
