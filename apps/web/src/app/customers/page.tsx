import { AppShell } from "@/app/_components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { inr } from "@/lib/format";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from("memberships").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership) return null;
  const { data: orders } = await supabase.from("orders").select("customer_name,customer_email,customer_phone,subtotal_paise,created_at,state").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(500);
  const customers = new Map<string, { name: string; email: string; phone: string | null; orders: number; spent: number; latest: string; states: Set<string> }>();
  for (const order of orders || []) {
    const key = order.customer_email.toLowerCase();
    const customer = customers.get(key) || { name: order.customer_name, email: order.customer_email, phone: order.customer_phone, orders: 0, spent: 0, latest: order.created_at, states: new Set<string>() };
    customer.orders += 1;
    if (!["cancelled", "refunded"].includes(order.state)) customer.spent += Number(order.subtotal_paise);
    customer.states.add(order.state);
    customers.set(key, customer);
  }
  const rows = [...customers.values()];
  return <AppShell active="/customers"><div className="page"><div className="page-head"><div><div className="eyebrow">Customer relationships</div><h1>Customers</h1><p className="subhead">A working customer list built from orders placed through your shop.</p></div></div><div className="grid stats"><article className="card"><div className="stat-label">Customers</div><div className="stat-value">{rows.length}</div><div className="stat-note">Unique customer emails</div></article><article className="card"><div className="stat-label">Orders</div><div className="stat-value">{orders?.length || 0}</div><div className="stat-note">Most recent 500 orders</div></article><article className="card"><div className="stat-label">Customer inbox</div><div className="stat-value">{rows.filter((customer) => customer.states.has("pending")).length}</div><div className="stat-note">Customers with pending orders</div></article><article className="card"><div className="stat-label">Repeat customers</div><div className="stat-value">{rows.filter((customer) => customer.orders > 1).length}</div><div className="stat-note">More than one order</div></article></div><section className="card section-card"><div className="section-title"><div><h2>Customer book</h2><p className="subhead" style={{fontSize:11,margin:0}}>Contact details come from checkout. Messaging and campaign consent are not collected here.</p></div><span className="badge muted">{rows.length} customers</span></div>{rows.length ? <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Orders</th><th>Order value</th><th>Latest order</th><th>Contact</th></tr></thead><tbody>{rows.map((customer) => <tr key={customer.email}><td><b>{customer.name}</b></td><td>{customer.orders}</td><td>{inr(customer.spent / 100)}</td><td>{new Date(customer.latest).toLocaleDateString("en-IN")}</td><td><a href={`mailto:${customer.email}`}>{customer.email}</a>{customer.phone && <><br/><a href={`tel:${customer.phone}`}>{customer.phone}</a></>}</td></tr>)}</tbody></table></div> : <div className="empty"><strong>No customers yet</strong>Customers appear here after their first order.</div>}</section><p className="fine-print" style={{marginTop:14}}>This page summarizes order records. It does not provide a live chat inbox or authorize promotional messages.</p></div></AppShell>;
}
