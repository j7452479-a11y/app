import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { TemplateCard } from "@/components/TemplateCard";
import { getTemplate, money, templates } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/templates/$slug")({
  loader: ({ params }) => {
    const template = getTemplate(params.slug);
    if (!template) throw notFound();
    return { template };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },{ title: "Template unavailable — Commerce OS" }, { name: "description", content: "This Commerce OS template is unavailable. Browse the sector catalog." }, { property: "og:title", content: "Template unavailable — Commerce OS" }, { property: "og:description", content: "Browse the Commerce OS sector template catalog." }, { name: "robots", content: "noindex" }],
      };
    }
    const { template } = loaderData;
    const title = `${template.name} — Commerce OS`;
    return {
      meta: [
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { title },
        { name: "description", content: template.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: template.tagline },
      ],
    };
  },
  component: TemplateDetail,
  notFoundComponent: TemplateMissing,
});

function TemplateMissing() {
  return (
    <StorePage>
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">We don't stock that one</h1>
        <p className="mt-2 text-muted-foreground">
          It may have been retired. Browse templates for what's in stock today.
        </p>
        <Link to="/templates" className="btn btn-primary mt-6">
          Browse templates
        </Link>
      </section>
    </StorePage>
  );
}

function TemplateDetail() {
  const { template } = Route.useLoaderData();
  const { add } = useCart();
  const related = templates.filter((t) => t.slug !== template.slug).slice(0, 4);

  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <nav className="font-mono text-[11px] uppercase tracking-wide text-subtle">
          <Link to="/templates" className="hover:text-foreground">
            Templates
          </Link>
          <span> / {template.category} / {template.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <img
              src={template.image}
              alt={`${template.name} template full preview`}
              width={1280}
              height={800}
              className="panel aspect-[16/10] w-full rounded-2xl object-cover"
            />
            <div className="panel mt-4 p-5">
              <SectionMarker>What's inside</SectionMarker>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {template.includes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-accent">▪</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-start">
            <SectionMarker>(c) Launch</SectionMarker>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{template.name}</h1>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-subtle">
              {template.category} · Sector template
            </p>
            <p className="mt-3 text-pretty text-muted-foreground">{template.description}</p>

            <div className="mt-5 flex items-center gap-4">
              <span className="text-3xl font-extrabold tracking-tight">
                {money(template.price)}
              </span>
              <span className="font-mono text-xs text-subtle">one-time · free updates</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link to="/sign-up" search={{ template: template.slug }} className="btn btn-primary">
                Use this template
              </Link>
              <Button type="button" variant="outline" onClick={() => add(template.slug)}>
                Add to cart
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-sm font-semibold">{template.sections}</p>
                <p className="font-mono text-[11px] text-subtle">sections</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{template.includes.length}</p>
                <p className="font-mono text-[11px] text-subtle">included features</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{template.version}</p>
                <p className="font-mono text-[11px] text-subtle">updated {template.updated}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <SectionMarker>Also in the catalog</SectionMarker>
            <Link to="/templates" className="text-sm font-semibold hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <TemplateCard key={t.slug} template={t} />
            ))}
          </div>
        </div>
      </section>
    </StorePage>
  );
}
