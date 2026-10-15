import Link from "next/link";
import { AppShell } from "@/app/_components/app-shell";
import { updateOrder } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { date, inr } from "@/lib/format";

export default async function Orders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_email,state,subtotal_paise,payment_method,payment_status,created_at",
    )
    .eq("organization_id", membership!.organization_id)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <AppShell active="/orders">
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Sales & fulfilment</div>
            <h1>Orders</h1>
            <p className="subhead">
              Track customer orders, payment and fulfilment.
            </p>
          </div>
        </div>
        <section className="card section-card">
          <div className="section-title">
            <h2>All orders</h2>
            <span className="badge muted">{orders?.length || 0} recent</span>
          </div>
          {orders?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Placed</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/orders/${o.id}`}>
                          <b>#{o.order_number}</b>
                        </Link>
                      </td>
                      <td>
                        {o.customer_name}
                        <br />
                        <span style={{ color: "#89938d", fontSize: 10 }}>
                          {o.customer_email}
                        </span>
                      </td>
                      <td>{date(o.created_at)}</td>
                      <td>
                        <span
                          className={`badge ${o.payment_status === "paid" ? "" : "warn"}`}
                        >
                          {o.payment_status} · {o.payment_method}
                        </span>
                      </td>
                      <td>{inr(Number(o.subtotal_paise) / 100)}</td>
                      <td>
                        <span
                          className={`badge ${o.state === "pending" ? "warn" : ""}`}
                        >
                          {o.state}
                        </span>
                      </td>
                      <td>
                        <form className="inline-form" action={updateOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <select
                            name="state"
                            defaultValue={o.state}
                            disabled={["cancelled", "refunded"].includes(
                              o.state,
                            )}
                          >
                            {o.state === "pending" && (
                              <>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirm</option>
                                {o.payment_status !== "paid" && (
                                  <option value="cancelled">Cancel</option>
                                )}
                              </>
                            )}
                            {o.state === "confirmed" && (
                              <>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                {o.payment_status !== "paid" && (
                                  <option value="cancelled">Cancel</option>
                                )}
                                {o.payment_status === "paid" && (
                                  <option value="refunded">Refund</option>
                                )}
                              </>
                            )}
                            {o.state === "processing" && (
                              <>
                                <option value="processing">Processing</option>
                                <option value="fulfilled">Fulfilled</option>
                                {o.payment_status !== "paid" && (
                                  <option value="cancelled">Cancel</option>
                                )}
                                {o.payment_status === "paid" && (
                                  <option value="refunded">Refund</option>
                                )}
                              </>
                            )}
                            {o.state === "fulfilled" && (
                              <>
                                <option value="fulfilled">Fulfilled</option>
                                {o.payment_status === "paid" && (
                                  <option value="refunded">Refund</option>
                                )}
                              </>
                            )}
                            {["cancelled", "refunded"].includes(o.state) && (
                              <option value={o.state}>{o.state}</option>
                            )}
                          </select>
                          {!["cancelled", "refunded"].includes(o.state) && (
                            <button className="button secondary small">
                              Save
                            </button>
                          )}
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <strong>No orders to show</strong>Orders placed through your
              published storefront appear here.
            </div>
          )}
        </section>
        <div className="notice warn" style={{ marginTop: 17 }}>
          Online payments are verified against the merchant’s Razorpay account
          before an order is marked paid.
        </div>
      </div>
    </AppShell>
  );
}
