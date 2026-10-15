import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-extrabold tracking-tight">Commerce OS</span>
          <span className="label-mono text-subtle">website templates</span>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link to="/templates" className="hover:text-foreground">
            Templates
          </Link>
          <Link to="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link to="/help" className="hover:text-foreground">
            Support
          </Link>
          <Link to="/sign-up" className="hover:text-foreground">
            Open a store
          </Link>
        </nav>
        <p className="font-mono text-[11px] text-subtle">© 2026 Commerce OS</p>
      </div>
    </footer>
  );
}
