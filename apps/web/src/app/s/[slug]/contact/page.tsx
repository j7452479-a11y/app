import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StorefrontInformationPage, getPublishedStorePage, getStorefrontPageMetadata } from "@/app/_components/storefront-information-page";
import { createPublicClient } from "@/lib/supabase/public";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return getStorefrontPageMetadata((await params).slug, "contact");
}
export default async function ContactPage({ params }: Props) {
  const { slug } = await params;
  const client = createPublicClient();
  if (!client) notFound();
  const page = await getPublishedStorePage(client, slug, "contact");
  if (!page) notFound();
  return <StorefrontInformationPage pageType="contact" content={page.content} storeName={page.store.display_name} templateId={page.store.template} />;
}
