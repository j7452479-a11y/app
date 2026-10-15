import { AppShell } from "@/app/_components/app-shell";
import {
  DomainForm,
  PaymentProfileForm,
  RevisionForm,
  StoreSettingsForm,
} from "@/app/_components/store-forms";
import {
  addCustomDomain,
  publishStore,
  requestRevision,
  saveMerchantPaymentProfile,
  saveStoreSettings,
  setCashOnDelivery,
  verifyCustomDomain,
} from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
export default async function Settings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from("memberships")
    .select("organization_id,role")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();
  const [
    { data: store },
    { data: org },
    { data: domains },
    { data: subscription },
    { data: revisions },
  ] = await Promise.all([
    supabase
      .from("stores")
      .select("display_name,description,template,published_at,cod_enabled")
      .eq("organization_id", m!.organization_id)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("slug")
      .eq("id", m!.organization_id)
      .maybeSingle(),
    supabase
      .from("custom_domains")
      .select(
        "id,hostname,status,verification_token,dns_record_type,dns_record_name,dns_target_type,dns_target_name,dns_target_value",
      )
      .eq("organization_id", m!.organization_id)
      .order("created_at"),
    supabase
      .from("subscriptions")
      .select("plan,revisions_used")
      .eq("organization_id", m!.organization_id)
      .maybeSingle(),
    supabase
      .from("site_revision_requests")
      .select("id,summary,status,created_at")
      .eq("organization_id", m!.organization_id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const revisionLimit =
    subscription?.plan === "pro" ? 5 : subscription?.plan === "plus" ? 3 : 1;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let paymentKey: string | null = null;
  if (url && serviceKey) {
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile } = await admin
      .from("store_payment_profiles")
      .select("key_id,enabled")
      .eq("organization_id", m!.organization_id)
      .maybeSingle();
    paymentKey = profile?.enabled ? profile.key_id : null;
  }
  return (
    <AppShell active="/settings">
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Workspace configuration</div>
            <h1>Settings</h1>
            <p className="subhead">
              Manage your public shop, theme and domain.
            </p>
          </div>
        </div>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}
        >
          <section className="card">
            <h2 style={{ fontSize: 21 }}>Store details</h2>
            {store && (
              <StoreSettingsForm action={saveStoreSettings} store={store} />
            )}
          </section>
          <section className="card">
            <h2 style={{ fontSize: 21 }}>Publishing</h2>
            <p className="subhead" style={{ fontSize: 13 }}>
              Your current address is <b>{org?.slug}.commerceos.in</b>.
            </p>
            <form action={publishStore}>
              <button
                className={`button ${store?.published_at ? "secondary" : ""}`}
                name="action"
                value={store?.published_at ? "unpublish" : "publish"}
              >
                {store?.published_at ? "Unpublish store" : "Publish storefront"}
              </button>
            </form>
            <p className="notice" style={{ marginTop: 16 }}>
              Your 30-day trial begins the first time you publish. Unpublishing
              will not reset the trial.
            </p>
            <h3 style={{ fontSize: 17, marginTop: 24 }}>Custom domains</h3>
            <p className="subhead" style={{ fontSize: 12 }}>
              Domains are attached to the hosting project, then checked against
              DNS before the store is routed. HTTPS certificates are provisioned
              by the hosting provider after DNS is correct.
            </p>
            <DomainForm action={addCustomDomain} />
            {domains?.map((d) => (
              <div className="domain-row" key={d.id}>
                <div>
                  <b>{d.hostname}</b>
                  {d.dns_record_name && (
                    <div className="subhead" style={{ fontSize: 11 }}>
                      {d.dns_record_type || "TXT"} {d.dns_record_name} → {d.verification_token}
                    </div>
                  )}
                  {d.dns_target_type && (
                    <div className="subhead" style={{ fontSize: 11 }}>
                      {d.dns_target_type} {d.dns_target_name} →{" "}
                      {d.dns_target_value}
                    </div>
                  )}
                </div>
                <span
                  className={`badge ${d.status === "verified" ? "" : "warn"}`}
                >
                  {d.status}
                </span>
                {d.status !== "verified" && (
                  <DomainForm action={verifyCustomDomain} domainId={d.id} />
                )}
              </div>
            ))}
          </section>
        </div>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            alignItems: "start",
            marginTop: 18,
          }}
        >
          <section className="card">
            <div className="eyebrow">Included with your plan</div>
            <h2 style={{ fontSize: 20 }}>Design revisions</h2>
            <p className="subhead" style={{ fontSize: 12, marginBottom: 12 }}>
              {subscription?.revisions_used || 0} of {revisionLimit} revision
              requests used.
            </p>
            <RevisionForm action={requestRevision} />
          </section>
          <section className="card">
            <h2 style={{ fontSize: 20 }}>Revision history</h2>
            {revisions?.length ? (
              revisions.map((r) => (
                <div className="domain-row" key={r.id}>
                  <div>
                    <b>{r.summary}</b>
                    <div className="subhead" style={{ fontSize: 11 }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className="badge muted">{r.status}</span>
                </div>
              ))
            ) : (
              <p className="subhead" style={{ fontSize: 12 }}>
                No revision requests yet.
              </p>
            )}
          </section>
        </div>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            alignItems: "start",
            marginTop: 18,
          }}
        >
          <section className="card">
            <h2 style={{ fontSize: 20 }}>Online payments</h2>
            <p className="subhead" style={{ fontSize: 12, marginBottom: 14 }}>
              Connect your own Razorpay merchant account. Test keys are safest
              while configuring your store.
            </p>
            <PaymentProfileForm
              action={saveMerchantPaymentProfile}
              keyId={paymentKey}
            />
            <p className="fine-print" style={{ marginTop: 13 }}>
              After saving, add a webhook in your Razorpay dashboard with URL{" "}
              <code>
                {process.env.NEXT_PUBLIC_APP_URL || "https://your-domain"}
                /api/webhooks/store-payment
              </code>
              . Subscribe to <code>payment.captured</code>,{" "}
              <code>payment.failed</code> and <code>refund.processed</code>.
            </p>
          </section>
          <section className="card">
            <h2 style={{ fontSize: 20 }}>Cash on delivery</h2>
            <p className="subhead" style={{ fontSize: 12, marginBottom: 16 }}>
              Allow customers to place orders and pay when the order arrives.
            </p>
            <form action={setCashOnDelivery}>
              <input
                type="hidden"
                name="enabled"
                value={store?.cod_enabled ? "false" : "true"}
              />
              <button className="button secondary">
                {store?.cod_enabled
                  ? "Turn off cash on delivery"
                  : "Turn on cash on delivery"}
              </button>
            </form>
          </section>
        </div>
        <section className="card" style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 19 }}>Account and data</h2>
          <p className="subhead" style={{ fontSize: 13 }}>
            Your store and customer records are isolated to your workspace. To
            request an export or account removal, contact support.
          </p>
          <p style={{ fontSize: 11, color: "#7c8780" }}>
            Account: {user?.email} · Role: {m?.role}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
