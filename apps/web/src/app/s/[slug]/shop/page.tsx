import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontCatalog } from "@/app/_components/storefront-catalog";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveStorefrontStock } from "@/lib/storefront-stock";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Props = { params: Promise<{ slug: string }> };

async function getAvailableStore(slug: string) {
  const client = createPublicClient();
  if (!client) return null;
  const [{ data: available }, { data: organization }] = await Promise.all([
    client.rpc("is_storefront_available", { store_slug: slug }),
    client.from("organizations").select("id").eq("slug", slug).maybeSingle(),
  ]);
  if (!available || !organization) return null;
  const { data: store } = await client
    .from("stores")
    .select("display_name")
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!store) return null;
  const { data: rows } = await client
    .from("products")
    .select(
      "id,organization_id,slug,status,name,description,price_paise,is_in_stock,image_url",
    )
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  let exactStockById = new Map<string, number>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: stockRows } = await admin
      .from("products")
      .select("id,stock")
      .eq("organization_id", organization.id)
      .eq("status", "published");
    exactStockById = new Map(
      (stockRows ?? []).map((product) => [product.id, product.stock]),
    );
  }

  return {
    store,
    organizationId: organization.id,
    products: (rows ?? []).map((product) => ({
      ...product,
      stock: resolveStorefrontStock(
        product.is_in_stock,
        exactStockById.get(product.id),
      ),
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getAvailableStore(slug);
  if (!store) return { title: "Store unavailable" };
  return { title: `Shop | ${store.store.display_name}` };
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;
  const store = await getAvailableStore(slug);
  if (!store) notFound();
  return (
    <StorefrontCatalog
      products={store.products}
      storeSlug={slug}
      storeName={store.store.display_name}
    />
  );
}
