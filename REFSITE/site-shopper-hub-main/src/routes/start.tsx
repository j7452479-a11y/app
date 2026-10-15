import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StorePage, SectionMarker } from "@/components/StorePage";
import { Button } from "@/components/ui/button";
import { templates, money } from "@/data/templates";

export const Route = createFileRoute("/start")({
  validateSearch: (search: Record<string, unknown>): { template?: string } => typeof search["template"] === "string" ? { template: search["template"] } : {},
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Set up your store — Commerce OS" },
      {
        name: "description",
        content:
          "Answer six short questions about your business and we prepare your website for launch.",
      },
      { property: "og:title", content: "Set up your store — Commerce OS" },
      {
        property: "og:description",
        content: "Six short questions and your website is ready to publish.",
      },
    ],
  }),
  component: StartPage,
});

const steps = [
  "Business",
  "What you sell",
  "Look",
  "Your details",
  "Payments",
  "Publish",
] as const;

const goals = ["Sell products", "Take bookings", "Send quotes", "Show my work"] as const;
const looks = ["Warm and calm", "Bold and loud", "Editorial and classic"] as const;

function StartPage() {
  const { template } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>(goals[0]);
  const [look, setLook] = useState<string>(looks[0]);
  const [pick, setPick] = useState(template && templates.some(t => t.slug === template) ? template : (templates[0]?.slug ?? ""));
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const chosen = templates.find((t) => t.slug === pick) ?? templates[0];
  if (!chosen) return null;
  const last = step === steps.length - 1;

  return (
    <StorePage>
      <section className="mx-auto max-w-4xl px-6 py-10">
        <SectionMarker>Set up</SectionMarker>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
          Prepare your storefront
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">Selected template: {chosen.name}</p>
        <ol className="mt-6 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li key={s}>
              <Button
                type="button"
                onClick={() => setStep(i)}
                className={`chip ${i === step ? "chip-active" : ""}`}
              >
                {i + 1}. {s}
              </Button>
            </li>
          ))}
        </ol>

        <div className="panel mt-6 p-6">
          {step === 0 ? (
            <Block title="What's the business called?" hint="This becomes your site's name.">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Morgan & Co."
                className="field max-w-md"
              />
            </Block>
          ) : null}

          {step === 1 ? (
            <Block title="What do you want the site to do?" hint="Pick the main job.">
              <div className="flex flex-wrap gap-2">
                {goals.map((g) => (
                  <Button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`chip ${goal === g ? "chip-active" : ""}`}
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </Block>
          ) : null}

          {step === 2 ? (
            <Block title="How should it feel?" hint="You can change this later without losing work.">
              <div className="flex flex-wrap gap-2">
                {looks.map((l) => (
                  <Button
                    key={l}
                    type="button"
                    onClick={() => setLook(l)}
                    className={`chip ${look === l ? "chip-active" : ""}`}
                  >
                    {l}
                  </Button>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {templates.map((t) => (
                  <Button
                    key={t.slug}
                    type="button"
                    onClick={() => setPick(t.slug)}
                    className={`rounded-xl p-2 text-left ${pick === t.slug ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                  >
                    <img
                      src={t.image}
                      alt={`${t.name} preview`}
                      loading="lazy"
                      width={1280}
                      height={800}
                      className="aspect-[16/10] w-full rounded-lg bg-muted object-cover"
                    />
                    <span className="mt-2 block text-sm font-semibold">{t.name}</span>
                    <span className="font-mono text-[11px] text-subtle">{money(t.price)}</span>
                  </Button>
                ))}
              </div>
            </Block>
          ) : null}

          {step === 3 ? (
            <Block title="Where can customers reach you?" hint="Shown in the footer and on receipts.">
              <div className="grid max-w-lg gap-3 sm:grid-cols-2">
                <input placeholder="Email" className="field" />
                <input placeholder="Phone" className="field" />
                <input placeholder="Street address" className="field sm:col-span-2" />
                <input placeholder="Opening hours (e.g. Mon–Sat 9–6)" className="field sm:col-span-2" />
              </div>
              <p className="mt-3 font-mono text-[11px] text-subtle">
                We don't invent these — anything you leave blank is simply hidden.
              </p>
            </Block>
          ) : null}

          {step === 4 ? (
            <Block title="How will you get paid?" hint="Card payments are on by default.">
              <div className="grid max-w-lg gap-3">
                <input placeholder="Payout account holder" className="field" />
                <input placeholder="Bank account or IBAN" className="field" />
                <select className="field">
                  <option>USD — US dollar</option>
                  <option>EUR — Euro</option>
                  <option>GBP — Pound sterling</option>
                  <option>INR — Indian rupee</option>
                </select>
              </div>
            </Block>
          ) : null}

          {step === 5 ? (
            <Block title="Choose your web address" hint="You can add your own domain later.">
              <div className="flex max-w-lg items-center gap-2">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="morganco"
                  className="field"
                />
                <span className="font-mono text-xs text-subtle">.commerceos.site</span>
              </div>
              <div className="mt-6 rounded-xl bg-muted p-4">
                <p className="label-mono text-subtle">Ready to publish</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Business: {name || "not set yet"}</li>
                  <li>Main job: {goal}</li>
                  <li>Feel: {look}</li>
                  <li>
                    Template: {chosen.name} · {money(chosen.price)}
                  </li>
                  <li>Address: {(address || "yourname") + ".commerceos.site"}</li>
                </ul>
              </div>
            </Block>
          ) : null}

          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <Button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="btn btn-secondary disabled:opacity-40"
            >
              Back
            </Button>
            {last ? (
              <Link to="/dashboard" className="btn btn-primary">
                Open workspace preview
              </Link>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="btn btn-primary"
              >
                Next: {steps[step + 1]}
              </Button>
            )}
          </div>
        </div>
      </section>
    </StorePage>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
