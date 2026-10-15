import { createFileRoute, Link } from "@tanstack/react-router";
import { StorePage, SectionMarker } from "@/components/StorePage";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Pricing — Commerce OS" },
      {
        name: "description",
        content:
          "Buy a website once, then pick a monthly plan for orders, bookings, and support. No setup fees hidden in the fine print.",
      },
      { property: "og:title", content: "Pricing — Commerce OS" },
      {
        property: "og:description",
        content: "Buy a website once, then pick a simple monthly plan.",
      },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Counter",
    price: "$19",
    per: "/month",
    blurb: "For a single shop finding its feet.",
    features: [
      "1 website",
      "Up to 100 products",
      "Card payments",
      "Order emails",
      "Email support",
    ],
  },
  {
    name: "Shopfront",
    price: "$49",
    per: "/month",
    blurb: "For a busy store with staff and bookings.",
    features: [
      "1 website + custom address",
      "Unlimited products",
      "Bookings and quotes",
      "5 staff accounts",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Chain",
    price: "$129",
    per: "/month",
    blurb: "For several locations under one roof.",
    features: [
      "5 websites",
      "Shared catalog",
      "Roles and permissions",
      "Data export and reports",
      "Named support contact",
    ],
  },
];

function PricingPage() {
  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionMarker>Pricing</SectionMarker>
        <h1 className="mt-3 max-w-[22ch] text-4xl font-extrabold tracking-tight">
          Pay once for the site. Pay monthly for the shop.
        </h1>
        <p className="mt-2 max-w-[52ch] text-muted-foreground">
          Every template has a one-time price on its page. The monthly plan below keeps your orders,
          bookings, and payments running.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`panel p-6 ${p.highlight ? "ring-2 ring-primary" : ""}`}
            >
              {p.highlight ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                  Most chosen
                </span>
              ) : null}
              <h2 className="mt-3 text-xl font-extrabold tracking-tight">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                <span className="font-mono text-xs text-subtle">{p.per}</span>
              </p>
              <ul className="mt-5 space-y-2 border-t border-border pt-4">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-accent">▪</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/sign-up"
                className={`btn mt-6 w-full ${p.highlight ? "btn-primary" : "btn-secondary"}`}
              >
                Start 30-day trial
              </Link>
            </div>
          ))}
        </div>

        <div className="panel mt-10 p-6">
          <SectionMarker>Good to know</SectionMarker>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <Note title="30 days free">
              Trials need no card. We ask for payment only before your site goes live.
            </Note>
            <Note title="Cancel anytime">
              Your data stays exportable for 30 days after you cancel.
            </Note>
            <Note title="No launch surprises">
              Setup is a flat $49 per site, shown in your cart before you pay.
            </Note>
          </div>
        </div>
      </section>
    </StorePage>
  );
}

function Note({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
