import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import React from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { StorefrontShell } from "@/app/_components/storefront-shell";
import type { StorefrontPageLink } from "@/app/_components/storefront-navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublishedStorePageTypes } from "@/lib/store-pages";
import {
  resolveStorefrontStock,
  type StorefrontCartProduct,
} from "@/lib/storefront-stock";

type Props = { children: ReactNode; params: Promise<{ slug: string }> };

export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params;
  const client = createPublicClient();
  if (!client) notFound();

  const [{ data: available }, { data: organization }] = await Promise.all([
    client.rpc("is_storefront_available", { store_slug: slug }),
    client.from("organizations").select("id").eq("slug", slug).maybeSingle(),
  ]);
  if (!available || !organization) notFound();

  const [{ data: store }, { data: products }, { data: pageRows }] =
    await Promise.all([
      client
        .from("stores")
        .select("display_name,template")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      client
        .from("products")
        .select("id,name,description,price_paise,is_in_stock,image_url")
        .eq("organization_id", organization.id)
        .eq("status", "published"),
      client
        .from("store_pages")
        .select("page_type,published_content,published_at")
        .eq("organization_id", organization.id)
        .not("published_content", "is", null),
    ]);
  if (!store) notFound();

  let plan = "basic";
  let exactStockById = new Map<string, number>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [{ data: subscription }, { data: stockRows }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("plan")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      admin
        .from("products")
        .select("id,stock")
        .eq("organization_id", organization.id)
        .eq("status", "published"),
    ]);
    plan = subscription?.plan ?? "basic";
    exactStockById = new Map(
      (stockRows ?? []).map((product) => [product.id, product.stock]),
    );
  }

  const publishedPages = getPublishedStorePageTypes(pageRows ?? []).map(
    (pageType) => ({ pageType }),
  ) as StorefrontPageLink[];
  const catalog: StorefrontCartProduct[] = (products ?? []).map((product) => ({
    ...product,
    stock: resolveStorefrontStock(
      product.is_in_stock,
      exactStockById.get(product.id),
    ),
  }));

  return (
    <StorefrontShell
      slug={slug}
      name={store.display_name}
      template={store.template}
      publishedPages={publishedPages}
      plan={plan}
      products={catalog}
    >
      {children}
    </StorefrontShell>
  );
}
