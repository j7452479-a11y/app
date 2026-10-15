import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function check(url: string, key: string, path: string) {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkPublicDatabaseRpc(url: string, key: string) {
  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/rpc/resolve_custom_domain`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostname: "health-check.invalid" }),
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const database = !!(
    url &&
    serviceKey &&
    (await check(url, serviceKey, "/rest/v1/organizations?select=id&limit=0"))
  );
  const publicDatabaseApi = !!(
    url &&
    publicKey &&
    (await checkPublicDatabaseRpc(url, publicKey))
  );
  const chatStorage = !!(
    url &&
    serviceKey &&
    (await check(url, serviceKey, "/storage/v1/bucket/customer-chat"))
  );
  const authConfigured = !!(url && publicKey);
  const required: Record<string, boolean> = {
    database,
    publicDatabaseApi,
    authConfigured,
  };
  const ready = Object.values(required).every(Boolean);

  return NextResponse.json(
    {
      status: ready ? "ready" : "degraded",
      checks: {
        database,
        publicDatabaseApi,
        authConfigured,
        customerChatStorage: chatStorage,
        orderEmailConfigured: !!(
          process.env.RESEND_API_KEY && process.env.EMAIL_FROM
        ),
        customDomainsConfigured: !!(
          process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID
        ),
        platformBillingConfigured: !!(
          process.env.RAZORPAY_KEY_ID &&
          process.env.RAZORPAY_KEY_SECRET &&
          process.env.RAZORPAY_WEBHOOK_SECRET
        ),
        encryptionConfigured: !!process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY,
      },
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
