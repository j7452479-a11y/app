import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { decryptSecret } from "@/lib/payments/crypto";
import { sendOrderReceipt } from "@/lib/email";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return NextResponse.json(
      { error: "Payment webhook is not configured" },
      { status: 503 },
    );
  const raw = await request.text();
  if (raw.length > 1_000_000)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let body: {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string; status?: string };
      };
      refund?: {
        entity?: { id?: string; payment_id?: string; status?: string };
      };
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const payment = body.payload?.payment?.entity,
    refund = body.payload?.refund?.entity;
  const paymentId = payment?.id || refund?.payment_id;
  if (!paymentId)
    return NextResponse.json(
      { error: "Payment event incomplete" },
      { status: 400 },
    );
  const admin = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order } = payment?.order_id
    ? await admin
        .from("orders")
        .select(
          "id,organization_id,state,order_number,customer_email,subtotal_paise",
        )
        .eq("provider_order_id", payment.order_id)
        .maybeSingle()
    : await admin
        .from("orders")
        .select(
          "id,organization_id,state,order_number,customer_email,subtotal_paise",
        )
        .eq("payment_reference", paymentId)
        .maybeSingle();
  if (!order) return NextResponse.json({ received: true, ignored: true });
  const { data: profile } = await admin
    .from("store_payment_profiles")
    .select("webhook_secret_ciphertext")
    .eq("organization_id", order.organization_id)
    .maybeSingle();
  if (!profile?.webhook_secret_ciphertext)
    return NextResponse.json(
      { error: "Store webhook secret is not set" },
      { status: 503 },
    );
  const supplied = request.headers.get("x-razorpay-signature") || "",
    eventId = request.headers.get("x-razorpay-event-id") || "";
  const secret = decryptSecret(profile.webhook_secret_ciphertext);
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(supplied),
    b = Buffer.from(expected);
  if (!eventId || a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  const provider = `razorpay_store:${order.organization_id}`;
  const { error: insertError } = await admin
    .from("provider_webhook_events")
    .insert({
      provider,
      event_id: eventId,
      event_type: body.event || "unknown",
    });
  if (insertError?.code === "23505")
    return NextResponse.json({ received: true, duplicate: true });
  if (insertError)
    return NextResponse.json(
      { error: "Could not register event" },
      { status: 500 },
    );
  let patch: {
    payment_status: string;
    payment_reference: string;
    state?: string;
    updated_at: string;
  } | null = null;
  if (
    body.event === "payment.captured" &&
    payment?.status === "captured" &&
    payment.id
  )
    patch = {
      payment_status: "paid",
      payment_reference: payment.id,
      state: "confirmed",
      updated_at: new Date().toISOString(),
    };
  if (body.event === "payment.failed" && payment?.id)
    patch = {
      payment_status: "failed",
      payment_reference: payment.id,
      updated_at: new Date().toISOString(),
    };
  if (body.event === "refund.processed" && refund?.status === "processed")
    patch = {
      payment_status: "refunded",
      payment_reference: paymentId,
      state: "refunded",
      updated_at: new Date().toISOString(),
    };
  if (patch) {
    let update = admin.from("orders").update(patch).eq("id", order.id);
    if (body.event === "payment.captured" || body.event === "payment.failed")
      update = update.eq("state", "pending");
    const { error } = await update;
    if (error) {
      await admin
        .from("provider_webhook_events")
        .delete()
        .eq("provider", provider)
        .eq("event_id", eventId);
      return NextResponse.json(
        { error: "Could not update the order" },
        { status: 500 },
      );
    }
  }
  if (
    body.event === "payment.captured" &&
    payment?.status === "captured" &&
    order.customer_email
  ) {
    const { data: organization } = await admin
      .from("organizations")
      .select("name,slug")
      .eq("id", order.organization_id)
      .maybeSingle();
    await sendOrderReceipt({
      to: order.customer_email,
      storeName: organization?.name || "Your shop",
      orderNumber: Number(order.order_number),
      totalPaise: Number(order.subtotal_paise),
      paymentMethod: "razorpay",
      storeUrl: organization?.slug
        ? `${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/s/${organization.slug}`
        : undefined,
    });
  }
  return NextResponse.json({ received: true });
}
