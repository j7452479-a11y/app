import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StorefrontInformationPage, getPublishedStorePage, getStorefrontPageMetadata } from "@/app/_components/storefront-information-page";
import { createPublicClient } from "@/lib/supabase/public";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return getStorefrontPageMetadata((await params).slug, "about");
}
export default async function AboutPage({ params }: Props) {
  const { slug } = await params;
  const client = createPublicClient();
  if (!client) notFound();
  const page = await getPublishedStorePage(client, slug, "about");
  if (!page) notFound();
  return <StorefrontInformationPage pageType="about" content={page.content} storeName={page.store.display_name} templateId={page.store.template} />;
}
