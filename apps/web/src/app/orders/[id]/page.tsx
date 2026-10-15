import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/app/_components/app-shell";
import { updateOrder } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { date, inr } from "@/lib/format";
export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_email,customer_phone,shipping_address,state,currency,subtotal_paise,payment_method,payment_status,payment_reference,created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();
  const { data: items } = await supabase
    .from("order_items")
    .select("product_name,quantity,unit_price_paise")
    .eq("order_id", order.id);
  const address = order.shipping_address as Record<string, string>;
  return (
    <AppShell active="/orders">
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">
              <Link href="/orders">Orders</Link> / #{order.order_number}
            </div>
            <h1>Order #{order.order_number}</h1>
            <p className="subhead">
              Placed {date(order.created_at)} · {order.customer_name}
            </p>
          </div>
          <span className="badge">{order.state}</span>
        </div>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1.2fr .8fr", alignItems: "start" }}
        >
          <section className="card section-card">
            <div className="section-title">
              <h2>Items</h2>
              <span
                className={`badge ${order.payment_status === "paid" ? "" : "warn"}`}
              >
                {order.payment_status} · {order.payment_method}
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item, index) => (
                    <tr key={`${item.product_name}-${index}`}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{inr(Number(item.unit_price_paise) / 100)}</td>
                      <td>
                        {inr(
                          (Number(item.unit_price_paise) * item.quantity) / 100,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3}>Order total</th>
                    <th>{inr(Number(order.subtotal_paise) / 100)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          <aside className="grid">
            <section className="card">
              <div className="eyebrow">Customer</div>
              <h2 style={{ fontSize: 20 }}>{order.customer_name}</h2>
              <p className="subhead" style={{ fontSize: 12 }}>
                <a href={`mailto:${order.customer_email}`}>
                  {order.customer_email}
                </a>
                {order.customer_phone && (
                  <>
                    <br />
                    <a href={`tel:${order.customer_phone}`}>
                      {order.customer_phone}
                    </a>
                  </>
                )}
              </p>
            </section>
            <section className="card">
              <div className="eyebrow">Deliver to</div>
              <p style={{ fontSize: 13 }}>
                {address.line1}
                <br />
                {address.city} {address.postal_code}
                <br />
                {address.country}
              </p>
            </section>
            <section className="card">
              <div className="eyebrow">Fulfilment</div>
              <p className="subhead" style={{ fontSize: 12 }}>
                Update the order as you pack and send it. Refunds are requested
                from Razorpay and marked complete only when the provider
                confirms.
              </p>
              <form className="inline-form" action={updateOrder}>
                <input type="hidden" name="id" value={order.id} />
                <select name="state" defaultValue={order.state}>
                  {order.state === "pending" && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirm</option>
                      {order.payment_status !== "paid" && (
                        <option value="cancelled">Cancel</option>
                      )}
                    </>
                  )}
                  {order.state === "confirmed" && (
                    <>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      {order.payment_status !== "paid" && (
                        <option value="cancelled">Cancel</option>
                      )}
                      {order.payment_status === "paid" && (
                        <option value="refunded">Refund</option>
                      )}
                    </>
                  )}
                  {order.state === "processing" && (
                    <>
                      <option value="processing">Processing</option>
                      <option value="fulfilled">Fulfilled</option>
                      {order.payment_status !== "paid" && (
                        <option value="cancelled">Cancel</option>
                      )}
                      {order.payment_status === "paid" && (
                        <option value="refunded">Refund</option>
                      )}
                    </>
                  )}
                  {order.state === "fulfilled" && (
                    <>
                      <option value="fulfilled">Fulfilled</option>
                      {order.payment_status === "paid" && (
                        <option value="refunded">Refund</option>
                      )}
                    </>
                  )}
                  {["cancelled", "refunded"].includes(order.state) && (
                    <option value={order.state}>{order.state}</option>
                  )}
                </select>
                {!["cancelled", "refunded"].includes(order.state) && (
                  <button className="button small">Save status</button>
                )}
              </form>
              {order.payment_reference && (
                <p className="fine-print">
                  Payment reference: {order.payment_reference}
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
