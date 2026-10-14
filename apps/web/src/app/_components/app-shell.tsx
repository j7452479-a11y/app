import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

const workspaceLinks = [
  { href: "/dashboard", name: "Overview" },
  { href: "/products", name: "Products" },
  { href: "/orders", name: "Orders" },
  { href: "/customers", name: "Customers" },
  { href: "/messages", name: "Messages" },
  { href: "/store", name: "Storefront" },
  { href: "/store/pages", name: "Store pages" },
  { href: "/campaigns", name: "Campaigns" },
  { href: "/assistant", name: "AI support" },
  { href: "/billing", name: "Plan & billing" },
  { href: "/settings", name: "Settings" },
];

export async function AppShell({ children, active }: { children: React.ReactNode; active: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: membership } = await supabase.from("memberships").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership) return <div className="auth-wrap"><div className="auth-card"><div className="brand"><span className="brand-mark">c.</span>Commerce OS</div><h1>Workspace is being set up</h1><p>If this takes more than a minute, verify your email and sign in again.</p></div></div>;
  const [{ data: store }, { data: subscription }] = await Promise.all([
    supabase.from("stores").select("display_name,published_at").eq("organization_id", membership.organization_id).maybeSingle(),
    supabase.from("subscriptions").select("state,trial_started_at,trial_ends_at,payment_failed_at").eq("organization_id", membership.organization_id).maybeSingle(),
  ]);
  const trialExpired = subscription?.state === "trialing" && !!subscription.trial_started_at && !!subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() < Date.now();
  const billingLocked = trialExpired || ["past_due", "suspended", "expired", "cancelled"].includes(subscription?.state || "");
  if (billingLocked && active !== "/billing") return <div className="auth-wrap"><section className="auth-card"><Link className="brand" href="/dashboard"><span className="brand-mark">c.</span>Commerce OS</Link><div className="eyebrow" style={{ marginTop: 28 }}>Workspace access paused</div><h1>Let’s get your shop back on track.</h1><p>{subscription?.payment_failed_at ? `A payment failed on ${new Date(subscription.payment_failed_at).toLocaleDateString("en-IN")}.` : "Your plan is not active."} Your dashboard is locked while billing needs attention.</p><Link className="button" href="/billing">Review plan & billing</Link><form action={signOut} style={{ marginTop: 12 }}><button className="button secondary">Sign out</button></form></section></div>;

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link className="brand" href="/dashboard"><span className="brand-mark">c.</span><span>Commerce OS<small>YOUR SHOP, IN ONE PLACE</small></span></Link>
        <nav className="workspace-nav" aria-label="Workspace navigation">
          {workspaceLinks.map((item) => <Link key={item.href} aria-current={active === item.href ? "page" : undefined} className={`workspace-link${active === item.href ? " active" : ""}`} href={item.href}>{item.name}</Link>)}
        </nav>
        <div className="topbar-actions">
          {store?.published_at && <Link className="header-store-link" href="/store">View shop <ArrowUpRight size={14}/></Link>}
          <span className="user-chip" title={user.email || "Account"}>{(user.email || "U").slice(0, 1).toUpperCase()}</span>
          <form action={signOut}><button className="signout-link" aria-label="Sign out"><LogOut size={15}/></button></form>
        </div>
      </header>
      <main className="main">
        <div className="workspace-context"><span className="eyebrow">(D) YOUR WORKSPACE</span><span>{store?.display_name || "Your shop"}</span></div>
        {children}
      </main>
    </div>
  );
}
