import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Storefront } from "@/app/_components/storefront";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveStorefrontStock } from "@/lib/storefront-stock";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const client=createPublicClient();if(!client)return{title:"Store unavailable"};const {data:org}=await client.from("organizations").select("id,name").eq("slug",slug).maybeSingle();return{title:org?.name||"Store",description:`Explore the collection at ${org?.name||"this independent store"}.`};}
export default async function PublicStore({params}:Props){
  const {slug}=await params;const client=createPublicClient();if(!client)notFound();
  const [{data:available},{data:org}]=await Promise.all([client.rpc("is_storefront_available",{store_slug:slug}),client.from("organizations").select("id").eq("slug",slug).maybeSingle()]);
  if(!available||!org)notFound();
  const [{data:store},{data:products}]=await Promise.all([
    client.from("stores").select("display_name,description,template,cod_enabled").eq("organization_id",org.id).maybeSingle(),
    client.from("products").select("id,name,description,price_paise,is_in_stock,image_url").eq("organization_id",org.id).eq("status","published").order("created_at",{ascending:false})
  ]);
  if(!store)notFound();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;let paymentEnabled=false,recommendationsEnabled=false,appEnabled=false;
  if(url&&serviceKey){const admin=createSupabaseClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});const [{data:profile},{data:subscription}]=await Promise.all([admin.from("store_payment_profiles").select("enabled").eq("organization_id",org.id).maybeSingle(),admin.from("subscriptions").select("plan,state").eq("organization_id",org.id).maybeSingle()]);paymentEnabled=!!profile?.enabled;recommendationsEnabled=subscription?.plan==="pro"&&["active","trialing"].includes(subscription.state);appEnabled=recommendationsEnabled;}
  return <Storefront slug={slug} name={store.display_name} description={store.description} template={store.template} codEnabled={store.cod_enabled} paymentEnabled={paymentEnabled} recommendationsEnabled={recommendationsEnabled} appEnabled={appEnabled} products={(products||[]).map(p=>({...p,stock:resolveStorefrontStock(p.is_in_stock)}))}/>;
}
