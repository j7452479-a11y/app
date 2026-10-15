import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StorePage, SectionMarker } from "@/components/StorePage";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Help and support — Commerce OS" },
      {
        name: "description",
        content:
          "Answers about launching, payments, domains, and your data — plus a form to reach a real person.",
      },
      { property: "og:title", content: "Help and support — Commerce OS" },
      {
        property: "og:description",
        content: "Answers about launching, payments, domains, and your data.",
      },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "How long until my site is live?",
    a: "Most sites go live within two working days of checkout. You'll answer a short setup questionnaire, we load your details, and you approve a preview before it publishes.",
  },
  {
    q: "Can I use my own web address?",
    a: "Yes. Every site starts on a free address ending in .commerceos.site, and you can point your own domain at it whenever you're ready.",
  },
  {
    q: "How do I get paid by customers?",
    a: "Card payments are built in. Money goes to your own payout account, and each order shows the fee and the amount you'll receive.",
  },
  {
    q: "Can I change template later?",
    a: "Yes. Your products, orders, and customers stay in place — only the look changes. You pay the new template's one-time price.",
  },
  {
    q: "Is my data mine?",
    a: "Always. You can export products, orders, and customers as spreadsheets at any time, and request full deletion from Settings.",
  },
];

function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [sent, setSent] = useState(false);

  return (
    <StorePage>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionMarker>Help</SectionMarker>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">We answer in plain words</h1>
        <p className="mt-2 max-w-[52ch] text-muted-foreground">
          Common questions first. If yours isn't here, send a message and a person replies within
          one working day.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="panel divide-y divide-border overflow-hidden">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold">{f.q}</span>
                  <span className="font-mono text-xs text-subtle">{open === i ? "−" : "+"}</span>
                </button>
                {open === i ? (
                  <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
                ) : null}
              </div>
            ))}
          </div>

          <aside className="panel h-fit p-5">
            <p className="label-mono text-subtle">Message us</p>
            {sent ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">Message sent</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll reply by email within one working day.
                </p>
              </div>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <label className="block">
                  <span className="text-sm font-medium">Your email</span>
                  <input type="email" required placeholder="you@business.com" className="field mt-1.5" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">What's happening?</span>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us what you're trying to do."
                    className="field mt-1.5"
                  />
                </label>
                <button type="submit" className="btn btn-primary w-full">
                  Send message
                </button>
              </form>
            )}
            <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
              Ready to build instead?{" "}
              <Link to="/sign-up" className="font-semibold hover:underline">
                Start your store
              </Link>
              .
            </p>
          </aside>
        </div>
      </section>
    </StorePage>
  );
}
