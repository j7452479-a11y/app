import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { Button } from "@/components/ui/button";
import { getTemplate, templates } from "@/data/templates";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>): { template?: string } => typeof search["template"] === "string" ? { template: search["template"] } : {},
  head: () => pageMeta("Start your business", "Choose a sector template and prepare your Commerce OS business workspace."),
  component: SignUpPage,
});
function SignUpPage() {
  const { template: id } = Route.useSearch();
  const template = id ? getTemplate(id) : templates[0];
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  if (!template) return <StorePage><section className="mx-auto max-w-4xl px-6 py-16"><h1 className="text-3xl font-bold">Choose a valid template</h1><Button asChild className="mt-6"><Link to="/templates">Browse templates</Link></Button></section></StorePage>;
  return <StorePage><section className="mx-auto max-w-6xl px-6 py-12">
    <SectionMarker>Start something of your own</SectionMarker>
    <h1 className="mt-3 text-4xl font-bold">Your business. Your storefront.</h1>
    <div className="mt-8 grid gap-10 md:grid-cols-2">
      <div><img src={template.image} alt={`${template.name} sector inspiration`} width={768} height={512} className="aspect-[3/2] w-full rounded-lg object-cover"/><div className="mt-5 flex items-start justify-between gap-4"><div><p className="label-mono text-accent">Selected template</p><h2 className="mt-1 text-2xl font-bold">{template.name}</h2><p className="mt-2 text-muted-foreground">{template.tagline}</p></div><Link to="/templates" className="text-sm font-semibold text-accent hover:underline">Change</Link></div><ul className="mt-5 space-y-2">{template.includes.map(item => <li key={item} className="flex gap-2 text-sm"><Check className="size-4 text-success"/>{item}</li>)}</ul></div>
      <div className="border-t border-border pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
      {ready ? <div role="status"><Check className="size-8 text-success"/><h2 className="mt-4 text-2xl font-bold">Your setup preview is ready</h2><p className="mt-3 text-muted-foreground">No account has been created. Continue to explore setup with your selected template.</p><Button asChild className="mt-6"><Link to="/start" search={{ template: template.slug }}>Continue to setup <ArrowRight/></Link></Button></div> : <form className="space-y-5" onSubmit={e => { e.preventDefault(); setReady(true); }}>
      <h2 className="text-xl font-bold">Start your 30-day trial</h2>
      <label className="block text-sm font-medium">Business name<input required minLength={2} maxLength={120} className="field mt-2" autoComplete="organization"/></label>
      <label className="block text-sm font-medium">Work email<input required type="email" className="field mt-2" autoComplete="email"/></label>
      <div className="text-sm font-medium"><label htmlFor="signup-password">Password</label><div className="relative mt-2"><input id="signup-password" required minLength={10} type={show ? "text" : "password"} className="field pr-12" autoComplete="new-password"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" aria-label={show ? "Hide password" : "Show password"} title={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff/> : <Eye/>}</Button></div><span className="mt-1 block text-xs text-muted-foreground">At least 10 characters</span></div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground"><input required type="checkbox" className="mt-1 accent-primary"/>I agree to the terms of service and privacy policy.</label>
      <Button type="submit" className="w-full">Continue <ArrowRight/></Button>
      <p className="text-xs text-muted-foreground">Frontend preview · no account creation or email verification yet.</p>
      </form>}
      </div>
    </div>
  </section></StorePage>;
}
