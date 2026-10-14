import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontProductDetail } from "@/app/_components/storefront-product-detail";
import {
  findPublishedProduct,
  type StorefrontCatalogProduct,
} from "@/app/_components/storefront-catalog";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveStorefrontStock } from "@/lib/storefront-stock";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Props = { params: Promise<{ slug: string; productSlug: string }> };

async function getAvailableProduct(slug: string, productSlug: string) {
  const client = createPublicClient();
  if (!client) return null;
  const [{ data: available }, { data: organization }] = await Promise.all([
    client.rpc("is_storefront_available", { store_slug: slug }),
    client.from("organizations").select("id").eq("slug", slug).maybeSingle(),
  ]);
  if (!available || !organization) return null;

  const [{ data: store }, { data: row }] = await Promise.all([
    client
      .from("stores")
      .select("display_name")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    client
      .from("products")
      .select(
        "id,organization_id,slug,status,name,description,price_paise,is_in_stock,image_url",
      )
      .eq("organization_id", organization.id)
      .eq("status", "published")
      .eq("slug", productSlug)
      .maybeSingle(),
  ]);
  if (!store || !row) return null;

  const productRow = findPublishedProduct(
    [
      {
        ...row,
        stock: resolveStorefrontStock(row.is_in_stock),
      } as StorefrontCatalogProduct,
    ],
    organization.id,
    productSlug,
  );
  if (!productRow) return null;

  let exactStock: number | undefined;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: stockRow } = await admin
      .from("products")
      .select("stock")
      .eq("organization_id", organization.id)
      .eq("status", "published")
      .eq("slug", productSlug)
      .maybeSingle();
    exactStock = stockRow?.stock;
  }

  return {
    store,
    product: {
      ...productRow,
      stock: resolveStorefrontStock(
        productRow.is_in_stock ?? productRow.stock > 0,
        exactStock,
      ),
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const result = await getAvailableProduct(slug, productSlug);
  if (!result) notFound();
  return {
    title: `${result.product.name} | ${result.store.display_name}`,
    description: result.product.description || result.product.name,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, productSlug } = await params;
  const result = await getAvailableProduct(slug, productSlug);
  if (!result) notFound();
  return (
    <StorefrontProductDetail storeSlug={slug} product={result.product} />
  );
}
