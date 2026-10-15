import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, DataTable, StatCard, StatusPill } from "@/components/DashboardShell";

export const Route = createFileRoute("/dashboard/bookings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Bookings — Commerce OS dashboard" },
      { name: "description", content: "See who is coming in, when, and what they have paid." },
      { property: "og:title", content: "Bookings — Commerce OS dashboard" },
      { property: "og:description", content: "See who is coming in, when, and what they paid." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingsPage,
});

const bookings = [
  { when: "Today · 10:30", who: "Rosa Idris", what: "Consultation · 45 min", paid: "Deposit $20" },
  { when: "Today · 14:00", who: "Theo Lund", what: "Table for 4", paid: "Pay on arrival" },
  { when: "Tomorrow · 09:15", who: "Ivy Chen", what: "Fitting · 30 min", paid: "Paid in full" },
  { when: "Fri · 16:45", who: "Bram Kelly", what: "Site walkthrough", paid: "Deposit $50" },
];

function BookingsPage() {
  return (
    <DashboardShell
      title="Bookings"
      intro="Your calendar as a simple list, newest first. Cancellations and deposits follow the rules you set."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This week" value="42" note="6 added today" positive />
        <StatCard label="No-shows" value="1" note="deposit kept" />
        <StatCard label="Free slots" value="18" note="next 7 days" />
      </div>

      <div className="mt-4">
        <DataTable
          columns={["When", "Customer", "What", "Payment"]}
          rows={bookings.map((b) => [b.when, b.who, b.what, b.paid])}
        />
      </div>

      <div className="panel mt-4 p-5">
        <p className="label-mono text-subtle">Today at a glance</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <StatusPill status="Launched" /> confirmed and paid
          <StatusPill status="In setup" /> waiting on a deposit
          <StatusPill status="Awaiting" /> needs you to confirm
        </div>
      </div>
    </DashboardShell>
  );
}
