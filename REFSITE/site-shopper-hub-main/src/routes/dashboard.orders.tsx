import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, DataTable, StatCard, StatusPill } from "@/components/DashboardShell";

export const Route = createFileRoute("/dashboard/orders")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Orders — Commerce OS dashboard" },
      { name: "description", content: "Track, filter, and fulfil every order from one list." },
      { property: "og:title", content: "Orders — Commerce OS dashboard" },
      { property: "og:description", content: "Track, filter, and fulfil every order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

type Status = "Launched" | "In setup" | "Awaiting";

const orders: { id: string; customer: string; item: string; value: string; status: Status }[] = [
  { id: "SH-1042", customer: "Rosa Idris", item: "Alto — storefront site", value: "$89", status: "Launched" },
  { id: "SH-1041", customer: "Bram Kelly", item: "Kestrel — SaaS site", value: "$49", status: "In setup" },
  { id: "SH-1040", customer: "Nadia Haq", item: "Copper Table — menu site", value: "$119", status: "Awaiting" },
  { id: "SH-1039", customer: "Theo Lund", item: "Harbor — bookings site", value: "$72", status: "Launched" },
  { id: "SH-1038", customer: "Ivy Chen", item: "Marlowe — portfolio site", value: "$64", status: "In setup" },
];

const filters = ["All", "Launched", "In setup", "Awaiting"] as const;

function OrdersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const rows = orders.filter((o) => filter === "All" || o.status === filter);

  return (
    <DashboardShell
      title="Orders"
      intro="Every purchase in one list. Filter by where it is in the launch, then open it to see the details."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This month" value="$1,842" note="+8.1% vs last month" positive />
        <StatCard label="Awaiting action" value="2" note="needs your details" />
        <StatCard label="Average order" value="$79" note="steady" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? "chip-active" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <DataTable
          columns={["Order", "Customer", "Value", "Status"]}
          rows={rows.map((o) => [
            <span>
              {o.id} · {o.item}
            </span>,
            o.customer,
            o.value,
            <StatusPill status={o.status} />,
          ])}
        />
      </div>
    </DashboardShell>
  );
}
