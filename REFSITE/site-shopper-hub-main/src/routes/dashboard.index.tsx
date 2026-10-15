import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, DataTable, StatCard, StatusPill } from "@/components/DashboardShell";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Store overview — Commerce OS dashboard" },
      {
        name: "description",
        content: "Revenue, orders, and bookings for your store at a glance.",
      },
      { property: "og:title", content: "Store overview — Commerce OS dashboard" },
      { property: "og:description", content: "Revenue, orders, and bookings at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <DashboardShell
      title="Store overview"
      intro="A quiet summary of how the shop is doing today. Everything here updates as orders arrive."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue" value="$4,280" note="+12.4% this month" positive />
        <StatCard label="Orders" value="186" note="24 pending launch" />
        <StatCard label="Bookings" value="42" note="6 this week" />
      </div>

      <div className="mt-4">
        <DataTable
          columns={["Recent orders", "Value", "Status"]}
          rows={[
            ["Alto — storefront site", "$89", <StatusPill status="Launched" />],
            ["Kestrel — SaaS site", "$49", <StatusPill status="In setup" />],
            ["Marlowe — portfolio site", "$64", <StatusPill status="Awaiting" />],
            ["Harbor — bookings site", "$72", <StatusPill status="Launched" />],
          ]}
        />
      </div>

      <div className="panel mt-4 p-5">
        <p className="label-mono text-subtle">Next steps</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Two products still need a photo.</li>
          <li>Your opening hours are empty on the contact page.</li>
          <li>Connect your own web address to replace the free one.</li>
        </ul>
        <Link to="/dashboard/settings" className="btn btn-primary btn-sm mt-4">
          Fix in settings
        </Link>
      </div>
    </DashboardShell>
  );
}
