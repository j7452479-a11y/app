import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Settings — Commerce OS dashboard" },
      {
        name: "description",
        content: "Business details, web address, payments, staff, and your data.",
      },
      { property: "og:title", content: "Settings — Commerce OS dashboard" },
      { property: "og:description", content: "Business details, web address, payments, and data." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <DashboardShell
      title="Settings"
      intro="Change how your shop looks and works. Nothing here needs technical knowledge."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
      >
        <div className="flex flex-wrap gap-3 border-b border-border pb-5"><Link to="/dashboard/revisions" className="btn btn-secondary btn-sm">Design revisions</Link><Link to="/dashboard/domains" className="btn btn-secondary btn-sm">Custom Domains</Link></div>
        <fieldset className="panel p-5">
          <legend className="label-mono px-1 text-subtle">Business</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Business name" placeholder="Morgan & Co." />
            <Field label="Contact email" placeholder="hello@morganco.com" />
            <Field label="Phone" placeholder="+1 555 0134" />
            <Field label="Opening hours" placeholder="Mon–Sat 9–6" />
          </div>
        </fieldset>

        <fieldset className="panel p-5">
          <legend className="label-mono px-1 text-subtle">Web address</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Free address" placeholder="morganco.commerceos.site" />
            <Field label="Your own domain" placeholder="morganco.com" />
          </div>
          <p className="mt-3 font-mono text-[11px] text-subtle">
            After you add a domain we show the two records to paste at your registrar.
          </p>
        </fieldset>

        <fieldset className="panel p-5">
          <legend className="label-mono px-1 text-subtle">Payments</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Payout account holder" placeholder="Morgan & Co." />
            <Field label="Bank account or IBAN" placeholder="•••• 4821" />
            <label className="block">
              <span className="text-sm font-medium">Currency</span>
              <select className="field mt-1.5">
                <option>USD — US dollar</option>
                <option>EUR — Euro</option>
                <option>GBP — Pound sterling</option>
                <option>INR — Indian rupee</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Plan</span>
              <select className="field mt-1.5">
                <option>Shopfront — $49/month</option>
                <option>Counter — $19/month</option>
                <option>Chain — $129/month</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="panel p-5">
          <legend className="label-mono px-1 text-subtle">Staff</legend>
          <div className="mt-3 space-y-2 text-sm">
            <Staff name="Alex Morgan" role="Owner" />
            <Staff name="Priya Nair" role="Manager" />
            <Staff name="Sam Doyle" role="Staff" />
          </div>
          <button type="button" className="btn btn-secondary btn-sm mt-4">
            Invite someone
          </button>
        </fieldset>

        <fieldset className="panel p-5">
          <legend className="label-mono px-1 text-subtle">Your data</legend>
          <p className="mt-3 text-sm text-muted-foreground">
            Export everything as spreadsheets, or ask us to delete your shop for good.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-secondary btn-sm">
              Export all data
            </button>
            <button
              type="button"
              className="btn btn-sm border border-border-strong text-destructive"
            >
              Delete my shop
            </button>
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          {saved ? (
            <span className="rounded-full bg-success-soft px-3 py-1 text-[11px] font-semibold text-success-foreground">
              Saved
            </span>
          ) : null}
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input placeholder={placeholder} className="field mt-1.5" />
    </label>
  );
}

function Staff({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
      <span className="font-medium">{name}</span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {role}
      </span>
    </div>
  );
}
