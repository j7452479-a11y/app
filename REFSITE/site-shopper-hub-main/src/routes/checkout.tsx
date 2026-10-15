import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { money } from "@/data/templates";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Checkout — Commerce OS" },
      { name: "description", content: "Pay once and start the launch of your new website." },
      { property: "og:title", content: "Checkout — Commerce OS" },
      { property: "og:description", content: "Pay once and start the launch of your new website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, count, clear } = useCart();
  const [placed, setPlaced] = useState(false);
  const setupFee = items.length > 0 ? 49 : 0;

  if (placed) {
    return (
      <StorePage>
        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <SectionMarker>Order placed</SectionMarker>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Your site is on its way</h1>
          <p className="mt-3 text-muted-foreground">
            We've saved your order. Next you'll answer a few questions about your business, then the
            site goes live.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/start" className="btn btn-primary">
              Set up my site
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              Open the dashboard
            </Link>
          </div>
        </section>
      </StorePage>
    );
  }

  if (count === 0) {
    return (
      <StorePage>
        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Nothing to check out yet</h1>
          <p className="mt-2 text-muted-foreground">Add a site to your cart first.</p>
          <Link to="/templates" className="btn btn-primary mt-6">
            Browse templates
          </Link>
        </section>
      </StorePage>
    );
  }

  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionMarker>Checkout</SectionMarker>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">One page, then you're done</h1>

        <form
          className="mt-7 grid gap-4 lg:grid-cols-[1.6fr_1fr]"
          onSubmit={(e) => {
            e.preventDefault();
            clear();
            setPlaced(true);
          }}
        >
          <div className="space-y-4">
            <fieldset className="panel p-5">
              <legend className="label-mono px-1 text-subtle">Your details</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Full name" placeholder="Alex Morgan" />
                <Field label="Email" type="email" placeholder="alex@business.com" />
                <Field label="Business name" placeholder="Morgan & Co." />
                <Field label="Phone" placeholder="+1 555 0134" required={false} />
              </div>
            </fieldset>

            <fieldset className="panel p-5">
              <legend className="label-mono px-1 text-subtle">Web address</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Preferred address" placeholder="morganco" />
                <div>
                  <span className="text-sm font-medium">Ends with</span>
                  <select className="field mt-1.5">
                    <option>.commerceos.site (free)</option>
                    <option>my own domain</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="panel p-5">
              <legend className="label-mono px-1 text-subtle">Payment</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Card number" placeholder="4242 4242 4242 4242" />
                <Field label="Name on card" placeholder="Alex Morgan" />
                <Field label="Expiry" placeholder="09 / 29" />
                <Field label="Security code" placeholder="123" />
              </div>
              <p className="mt-3 font-mono text-[11px] text-subtle">
                Demo checkout — no card is charged and nothing is stored.
              </p>
            </fieldset>
          </div>

          <aside className="panel h-fit p-5">
            <p className="label-mono text-subtle">Order</p>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.template.slug} className="flex items-center gap-3">
                  <img
                    src={item.template.image}
                    alt={`${item.template.name} preview`}
                    loading="lazy"
                    width={1280}
                    height={800}
                    className="h-12 w-20 rounded-md bg-muted object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.template.name}</p>
                    <p className="font-mono text-[11px] text-subtle">Qty {item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {money(item.template.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sites</span>
                <span className="font-medium">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Launch setup</span>
                <span className="font-medium">{money(setupFee)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold">Total today</span>
              <span className="text-2xl font-extrabold tracking-tight">
                {money(subtotal + setupFee)}
              </span>
            </div>
            <button type="submit" className="btn btn-primary mt-5 w-full">
              Pay and start launch
            </button>
            <Link to="/cart" className="btn btn-secondary mt-2 w-full">
              Back to cart
            </Link>
          </aside>
        </form>
      </section>
    </StorePage>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input type={type} placeholder={placeholder} required={required} className="field mt-1.5" />
    </label>
  );
}
