import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const tokenPattern = /^[a-f0-9]{64}$/;

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: noStore });
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Order tracking request is invalid." }, 400);
  }

  if (!input || typeof input !== "object") {
    return json({ error: "Order tracking request is invalid." }, 400);
  }
  const { slug, token } = input as Record<string, unknown>;
  if (
    typeof slug !== "string" ||
    slug.length > 80 ||
    !slugPattern.test(slug) ||
    typeof token !== "string" ||
    !tokenPattern.test(token)
  ) {
    return json({ error: "Order tracking request is invalid." }, 400);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return json({ error: "Order tracking is temporarily unavailable." }, 503);
  }

  try {
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,organization_id,order_number,state,created_at")
      .eq("customer_chat_token_hash", tokenHash)
      .maybeSingle();
    if (orderError || !order) {
      return json({ error: "Order tracking is unavailable for this link." }, 404);
    }

    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (organizationError || !organization || organization.id !== order.organization_id) {
      return json({ error: "Order tracking is unavailable for this link." }, 404);
    }

    const [{ data: available, error: availabilityError }, { data: subscription, error: subscriptionError }] =
      await Promise.all([
        admin.rpc("is_storefront_available", { store_slug: slug }),
        admin
          .from("subscriptions")
          .select("plan")
          .eq("organization_id", order.organization_id)
          .maybeSingle(),
      ]);
    if (
      availabilityError ||
      !available ||
      subscriptionError ||
      !subscription ||
      (subscription.plan !== "plus" && subscription.plan !== "pro")
    ) {
      return json({ error: "Order tracking is unavailable for this store." }, 404);
    }

    return json(
      {
        order: {
          order_number: order.order_number,
          state: order.state,
          created_at: order.created_at,
        },
      },
      200,
    );
  } catch {
    return json({ error: "Order tracking is temporarily unavailable." }, 503);
  }
}
