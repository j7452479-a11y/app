import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, DataTable, StatCard } from "@/components/DashboardShell";

export const Route = createFileRoute("/dashboard/customers")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Customers — Commerce OS dashboard" },
      { name: "description", content: "Search your customers and see what each has spent." },
      { property: "og:title", content: "Customers — Commerce OS dashboard" },
      { property: "og:description", content: "Search customers and see what each has spent." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});

const customers = [
  { name: "Rosa Idris", email: "rosa@idris.co", orders: 4, spent: "$412", since: "Mar 2025" },
  { name: "Bram Kelly", email: "bram@kellyworks.com", orders: 2, spent: "$138", since: "Jul 2025" },
  { name: "Nadia Haq", email: "nadia@haqfoods.com", orders: 6, spent: "$742", since: "Jan 2025" },
  { name: "Theo Lund", email: "theo@lundstudio.se", orders: 1, spent: "$72", since: "Feb 2026" },
  { name: "Ivy Chen", email: "ivy@chen.design", orders: 3, spent: "$226", since: "Nov 2025" },
];

function CustomersPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = customers.filter(
    (c) => q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  );

  return (
    <DashboardShell
      title="Customers"
      intro="Everyone who has bought or booked, with what they spent. Export the whole list whenever you like."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Customers" value="248" note="+14 this month" positive />
        <StatCard label="Repeat rate" value="38%" note="of all orders" />
        <StatCard label="Average spend" value="$164" note="lifetime" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search customers"
          className="field max-w-64"
        />
        <button type="button" className="btn btn-secondary btn-sm">
          Export spreadsheet
        </button>
      </div>

      <div className="mt-4">
        <DataTable
          columns={["Customer", "Orders", "Spent", "Since"]}
          rows={rows.map((c) => [
            <span>
              {c.name} · <span className="text-muted-foreground">{c.email}</span>
            </span>,
            String(c.orders),
            c.spent,
            c.since,
          ])}
        />
      </div>
    </DashboardShell>
  );
}
