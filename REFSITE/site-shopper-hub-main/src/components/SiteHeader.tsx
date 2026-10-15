import { Link } from "@tanstack/react-router";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
const nav = [{ to: "/templates", label: "Templates" }, { to: "/solutions", label: "Solutions" }, { to: "/pricing", label: "Pricing" }, { to: "/help", label: "Help" }] as const;
export function SiteHeader() {
 const { count } = useCart(); const [open,setOpen] = useState(false);
 return <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
  <Link to="/" className="shrink-0 font-display text-lg font-extrabold">Commerce OS<span className="text-accent">.</span></Link>
  <nav className="ml-5 hidden gap-5 text-sm text-muted-foreground lg:flex">{nav.map(n => <Link key={n.to} to={n.to} activeProps={{className:"font-bold text-accent"}} className="hover:text-foreground">{n.label}</Link>)}</nav>
  <div className="ml-auto flex items-center gap-2"><Button asChild variant="ghost" size="icon"><Link to="/cart" aria-label={`Cart, ${count} items`} title="Cart"><ShoppingBag/></Link></Button><Link to="/dashboard" className="hidden text-sm font-semibold sm:block">Workspace</Link><Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/sign-up">Get started</Link></Button><Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</Button></div>
 </div>{open && <nav className="flex flex-wrap gap-5 border-t border-border px-6 py-4 text-sm lg:hidden">{nav.map(n => <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>)}<Link to="/dashboard" onClick={() => setOpen(false)}>Workspace</Link><Link to="/sign-up" onClick={() => setOpen(false)} className="font-semibold text-accent">Get started</Link></nav>}</header>;
}
