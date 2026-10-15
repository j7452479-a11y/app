import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

export function MarketingHeader({ dashboardHref = "/sign-in" }: { dashboardHref?: string }) {
  return (
    <header className="market-header">
      <Link className="brand" href="/"><span className="brand-mark">c.</span><span>Commerce OS<small>INDEPENDENT COMMERCE</small></span></Link>
      <nav aria-label="Main navigation">
        <Link href="/templates">Templates</Link>
        <Link href="/solutions">Solutions</Link>
        <Link href="/about">Read</Link>
        <Link href="/#plans">Pricing</Link>
        <Link href="/help">Help</Link>
      </nav>
      <div className="market-actions">
        <Link className="search-link" href="/templates"><Search size={14}/> Find a look</Link>
        <Link className="button secondary small" href={dashboardHref}>Dashboard <ArrowUpRight size={13}/></Link>
        <Link className="button small" href="/sign-up">Start your store</Link>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return <footer className="market-footer"><Link className="brand" href="/"><span className="brand-mark">c.</span>Commerce OS</Link><span>Independent commerce, thoughtfully online.</span><div><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/help">Help</Link></div></footer>;
}
