import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Megaphone, Globe, Sparkles } from "lucide-react";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { TemplateCard } from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";
import { templates } from "@/data/templates";
import { pageMeta } from "@/lib/page-meta";
import cover from "@/assets/commerce-cover.jpg";
export const Route = createFileRoute("/")({ head: () => pageMeta("Website templates for your business", "Discover Commerce OS: fourteen sector-specific website templates and one simple merchant workspace."), component: Home });
function Home() {
  return <StorePage>
    <section className="commerce-cover relative isolate overflow-hidden">
      <img src={cover} alt="Independent lifestyle shop with a product storefront on the counter" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 size-full object-cover"/>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 text-cover-foreground">
        <p className="label-mono">A home for your business online</p><h1 className="mt-5 text-5xl font-bold leading-tight sm:text-6xl">Commerce OS</h1><p className="mt-5 max-w-[38ch] text-lg leading-relaxed">Find a storefront that feels like you. Fourteen sectors, thoughtfully designed. One place to run it all.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/templates">Explore templates <ArrowRight/></Link></Button><Button asChild variant="outline" size="lg"><Link to="/sign-up">Start your business</Link></Button></div>
        <p className="mt-7 text-sm">14 sector templates <span className="mx-3">/</span> 30-day trial</p>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-6 py-10"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5"><div><SectionMarker>The template collection</SectionMarker><h2 className="mt-2 text-3xl font-bold">Made for what you do.</h2></div><Button asChild variant="link"><Link to="/templates">All 14 templates <ArrowRight/></Link></Button></div><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{templates.slice(0,4).map(t => <TemplateCard key={t.slug} template={t}/>)}</div></section>
    <section className="border-y border-border bg-card"><div className="mx-auto max-w-7xl px-6 py-12"><SectionMarker>Beyond the storefront</SectionMarker><h2 className="mt-3 text-3xl font-bold">Your business, in good company.</h2><div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{[{icon:LayoutGrid,title:"Daily operations",text:"Orders, bookings, and customers.",to:"/dashboard"},{icon:Megaphone,title:"Campaigns & revisions",text:"A direct line to your platform team.",to:"/dashboard/campaigns"},{icon:Sparkles,title:"AI Assistant",text:"A little support for your next decision.",to:"/dashboard/ai-assistant"},{icon:Globe,title:"Your own address",text:"Put your business name first.",to:"/dashboard/domains"}].map(x => <Link key={x.title} to={x.to} className="border-t border-border pt-5"><x.icon className="size-6 text-accent"/><h3 className="mt-4 text-lg font-bold">{x.title}</h3><p className="mt-2 text-sm text-muted-foreground">{x.text}</p><ArrowRight className="mt-4 size-4 text-accent"/></Link>)}</div></div></section>
  </StorePage>;
}
