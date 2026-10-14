import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Storefront } from "@/app/_components/storefront";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveStorefrontStock } from "@/lib/storefront-stock";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const client = createPublicClient();
  if (!client) return { title: "Store unavailable" };
  const [{ data: available }, { data: organization }] = await Promise.all([
    client.rpc("is_storefront_available", { store_slug: slug }),
    client.from("organizations").select("id,name").eq("slug", slug).maybeSingle(),
  ]);
  if (!available || !organization) return { title: "Store unavailable" };
  return {
    title: organization.name || "Store",
    description: `Explore the collection at ${organization.name || "this store"}.`,
  };
}

export default async function PublicStore({ params }: Props) {
  const { slug } = await params;
  const client = createPublicClient();
  if (!client) notFound();

  const [{ data: available }, { data: organization }] = await Promise.all([
    client.rpc("is_storefront_available", { store_slug: slug }),
    client.from("organizations").select("id").eq("slug", slug).maybeSingle(),
  ]);
  if (!available || !organization) notFound();

  const [{ data: store }, { data: products }] = await Promise.all([
    client
      .from("stores")
      .select("display_name,description,template,cod_enabled")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    client
      .from("products")
      .select("id,slug,name,description,price_paise,is_in_stock,image_url")
      .eq("organization_id", organization.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);
  if (!store) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let paymentEnabled = false;
  let recommendationsEnabled = false;
  let appEnabled = false;
  let exactStockById = new Map<string, number>();
  if (url && serviceKey) {
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [
      { data: profile },
      { data: subscription },
      { data: stockRows },
    ] = await Promise.all([
      admin
        .from("store_payment_profiles")
        .select("enabled")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      admin
        .from("subscriptions")
        .select("plan,state")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      admin
        .from("products")
        .select("id,stock")
        .eq("organization_id", organization.id)
        .eq("status", "published"),
    ]);
    paymentEnabled = !!profile?.enabled;
    recommendationsEnabled =
      subscription?.plan === "pro" &&
      ["active", "trialing"].includes(subscription.state);
    appEnabled = recommendationsEnabled;
    exactStockById = new Map(
      (stockRows ?? []).map((product) => [product.id, product.stock]),
    );
  }

  return (
    <Storefront
      slug={slug}
      name={store.display_name}
      description={store.description}
      template={store.template}
      codEnabled={store.cod_enabled}
      paymentEnabled={paymentEnabled}
      recommendationsEnabled={recommendationsEnabled}
      appEnabled={appEnabled}
      products={(products ?? []).map((product) => ({
        ...product,
        stock: resolveStorefrontStock(
          product.is_in_stock,
          exactStockById.get(product.id),
        ),
      }))}
    />
  );
}
