import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { money, type Template } from "@/data/templates";
import { Button } from "@/components/ui/button";

export function TemplateCard({ template }: { template: Template }) {
  return <article className="panel overflow-hidden border border-border transition-transform duration-300 hover:-translate-y-1">
    <Link to="/templates/$slug" params={{ slug: template.slug }} className="relative block">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2"><span className="flex gap-1"><span className="size-1.5 rounded-full bg-border-strong"/><span className="size-1.5 rounded-full bg-border-strong"/><span className="size-1.5 rounded-full bg-border-strong"/></span><span className="text-[10px] text-subtle">{template.slug}.store</span><ArrowUpRight className="size-3 text-subtle"/></div>
      <img src={template.image} alt={`${template.name} sector inspiration`} loading="lazy" width={768} height={512} className="aspect-[3/2] w-full bg-muted object-cover"/>
      <div className="border-b border-border bg-background px-4 py-3"><span className="text-[10px] uppercase text-accent">{template.category} collection</span><p className="mt-1 font-display text-base font-semibold">{template.name}</p></div>
    </Link>
    <div className="p-4"><Link to="/templates/$slug" params={{ slug: template.slug }} className="font-display text-base font-bold hover:underline">{template.name}</Link><p className="mt-2 min-h-10 text-sm text-muted-foreground">{template.tagline}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-lg font-bold">{money(template.price)}</span><Button asChild size="sm"><Link to="/sign-up" search={{ template: template.slug }}>Use template <ArrowUpRight/></Link></Button></div></div>
  </article>;
}
