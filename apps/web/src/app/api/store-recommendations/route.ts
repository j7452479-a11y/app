import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { slug, need } = await request.json() as { slug?: string; need?: string };
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !need || need.length < 3 || need.length > 280) return NextResponse.json({ error: "Tell us what you are looking for in 3 to 280 characters." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY, apiKey = process.env.OPENAI_API_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Recommendations are being set up for this shop." }, { status: 503 });
  const supabase = createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (!org) return NextResponse.json({ error: "Shop could not be found." }, { status: 404 });
  const [{ data: subscription }, { data: products }] = await Promise.all([
    supabase.from("subscriptions").select("plan,state").eq("organization_id", org.id).maybeSingle(),
    supabase.from("products").select("id,name,description,price_paise").eq("organization_id", org.id).eq("status", "published").gt("stock", 0).limit(80),
  ]);
  if (subscription?.plan !== "pro" || !["active", "trialing"].includes(subscription.state)) return NextResponse.json({ error: "This shop has not enabled recommendations." }, { status: 403 });
  if (!apiKey) return NextResponse.json({ error: "Recommendations are not connected yet." }, { status: 503 });
  const catalogue = (products || []).map((product) => ({ id: product.id, name: product.name, description: product.description, price_inr: Number(product.price_paise) / 100 }));
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", store: false, input: [{ role: "system", content: "You help a shopper choose only from the supplied catalogue. Return concise JSON only: {\"intro\":string,\"ids\":string[]}. Pick at most three matching product IDs. Do not infer customer traits, make health claims, invent stock, or mention items outside the catalogue." }, { role: "user", content: JSON.stringify({ shopper_need: need, catalogue }) }], max_output_tokens: 350 }), cache: "no-store" });
  if (!response.ok) return NextResponse.json({ error: "Recommendations are temporarily unavailable." }, { status: 502 });
  const data = await response.json() as { output_text?: string };
  try { const parsed = JSON.parse(data.output_text || "{}"); const ids = Array.isArray(parsed.ids) ? parsed.ids.filter((id: unknown) => typeof id === "string" && catalogue.some((product) => product.id === id)).slice(0, 3) : []; return NextResponse.json({ intro: typeof parsed.intro === "string" ? parsed.intro.slice(0, 240) : "Here are a few options from this shop.", ids }); } catch { return NextResponse.json({ error: "Recommendations could not be read. Please try a different request." }, { status: 502 }); }
}
