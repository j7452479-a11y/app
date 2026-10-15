import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StorePage } from "@/components/StorePage";

const links = [
  { to: "/dashboard", label: "Store", exact: true },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/bookings", label: "Bookings" },
  { to: "/dashboard/customers", label: "Customers" },
  { to: "/dashboard/campaigns", label: "Campaigns" },
  { to: "/dashboard/revisions", label: "Revisions" },
  { to: "/dashboard/ai-assistant", label: "AI Assistant" },
  { to: "/dashboard/domains", label: "Custom Domains" },
  { to: "/dashboard/settings", label: "Settings" },
] as const;

export function DashboardShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="label-mono text-accent">Your dashboard</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-[52ch] text-muted-foreground">{intro}</p>

        <div className="mt-7 grid gap-4 lg:grid-cols-[200px_1fr]">
          <aside className="flex h-fit flex-wrap gap-1 border-b border-border pb-4 lg:block lg:border-b-0 lg:border-r lg:pr-4">
            <p className="label-mono w-full px-2 pb-2 text-subtle">Overview</p>
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: "exact" in l }}
                activeProps={{ className: "bg-muted font-semibold text-foreground" }}
                className="mt-1 block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </StorePage>
  );
}

export function StatCard({
  label,
  value,
  note,
  positive,
}: {
  label: string;
  value: string;
  note: string;
  positive?: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      <p
        className={`mt-1 font-mono text-[11px] ${positive ? "text-success-foreground" : "text-subtle"}`}
      >
        {note}
      </p>
    </div>
  );
}

export function StatusPill({ status }: { status: "Launched" | "In setup" | "Awaiting" }) {
  const tone =
    status === "Launched"
      ? "bg-success-soft text-success-foreground"
      : status === "In setup"
        ? "bg-accent-soft text-accent"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  const gridTemplateColumns = `1fr repeat(${Math.max(columns.length - 1, 1)}, auto)`;
  return (
    <div className="overflow-x-auto"><div className="panel min-w-[550px] overflow-hidden">
      <div
        style={{ gridTemplateColumns }}
        className="grid items-center gap-3 border-b border-border px-4 py-3 label-mono text-subtle"
      >
        {columns.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{ gridTemplateColumns }}
          className={`grid items-center gap-3 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}
        >
          {row.map((cell, j) => (
            <span key={j} className={j === 0 ? "font-medium" : "text-muted-foreground"}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div></div>
  );
}
