import { createFileRoute, Link } from "@tanstack/react-router";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { money } from "@/data/templates";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Your cart — Commerce OS" },
      { name: "description", content: "Review the websites in your cart before checkout." },
      { property: "og:title", content: "Your cart — Commerce OS" },
      { property: "og:description", content: "Review the websites in your cart before checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove, count } = useCart();
  const setupFee = items.length > 0 ? 49 : 0;

  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionMarker>Your cart</SectionMarker>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
          {count === 0 ? "Your cart is empty" : `${count} ${count === 1 ? "site" : "sites"} ready`}
        </h1>

        {count === 0 ? (
          <div className="panel mt-6 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Pick a storefront from the catalog and it will show up.
            </p>
            <Link to="/templates" className="btn btn-primary mt-6">
              Browse templates
            </Link>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="panel overflow-hidden">
              {items.map((item, i) => (
                <div
                  key={item.template.slug}
                  className={`flex flex-wrap items-center gap-4 p-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <img
                    src={item.template.image}
                    alt={`${item.template.name} preview`}
                    loading="lazy"
                    width={1280}
                    height={800}
                    className="h-16 w-28 rounded-lg bg-muted object-cover"
                  />
                  <div className="min-w-40 flex-1">
                    <Link
                      to="/templates/$slug"
                      params={{ slug: item.template.slug }}
                      className="text-sm font-semibold hover:underline"
                    >
                      {item.template.name}
                    </Link>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-subtle">
                      {item.template.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Fewer ${item.template.name} licences`}
                      onClick={() => setQty(item.template.slug, item.qty - 1)}
                      className="chip"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      aria-label={`More ${item.template.name} licences`}
                      onClick={() => setQty(item.template.slug, item.qty + 1)}
                      className="chip"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right text-lg font-extrabold tracking-tight">
                    {money(item.template.price * item.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(item.template.slug)}
                    className="font-mono text-[11px] uppercase tracking-wide text-subtle hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <aside className="panel h-fit p-5">
              <p className="label-mono text-subtle">Summary</p>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Sites" value={money(subtotal)} />
                <Row label="Launch setup" value={money(setupFee)} />
                <Row label="Support (first year)" value="Included" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold">Total today</span>
                <span className="text-2xl font-extrabold tracking-tight">
                  {money(subtotal + setupFee)}
                </span>
              </div>
              <Link to="/checkout" className="btn btn-primary mt-5 w-full">
                Go to checkout
              </Link>
              <Link to="/templates" className="btn btn-secondary mt-2 w-full">
                Keep browsing
              </Link>
            </aside>
          </div>
        )}
      </section>
    </StorePage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
