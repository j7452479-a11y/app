import type { Metadata } from "next";
import React from "react";
import { parseStorePageContent, type StorePageContent, type StorePageType } from "@/lib/store-pages";
import { storefrontPageTitle } from "./storefront-page-layout";
import { StorefrontPageLayout } from "./storefront-page-layout";
import { createPublicClient } from "@/lib/supabase/public";

type PublicClient = NonNullable<ReturnType<typeof createPublicClient>>;

export type PublishedStorePage = {
  organizationId: string;
  store: { display_name: string; template: string };
  content: StorePageContent;
};

export async function getPublishedStorePage(
  client: PublicClient,
  slug: string,
  pageType: StorePageType,
): Promise<PublishedStorePage | null> {
  const [{ data: available }, { data: organization }] = await Promise.all([
    client.rpc("is_storefront_available", { store_slug: slug }),
    client.from("organizations").select("id").eq("slug", slug).maybeSingle(),
  ]);
  if (!available || !organization?.id) return null;

  const [{ data: store }, { data: page }] = await Promise.all([
    client
      .from("stores")
      .select("display_name,template")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    client
      .from("store_pages")
      .select("published_content")
      .eq("organization_id", organization.id)
      .eq("page_type", pageType)
      .maybeSingle(),
  ]);
  if (!store || !page?.published_content) return null;

  const parsed = parseStorePageContent(pageType, page.published_content);
  if (!parsed.success) return null;
  return { organizationId: organization.id, store, content: parsed.data };
}
export async function getStorefrontPageMetadata(
  slug: string,
  pageType: StorePageType,
): Promise<Metadata> {
  const client = createPublicClient();
  if (!client) return { title: "Store unavailable" };
  const page = await getPublishedStorePage(client, slug, pageType);
  if (!page) return { title: "Store unavailable" };

  let description: string | undefined;
  if (page.content.pageType === "about") description = page.content.headline ?? page.content.story;
  if (page.content.pageType === "faq") description = page.content.items[0]?.answer;
  if (page.content.pageType === "shipping_returns") description = page.content.deliveryAreas;
  if (page.content.pageType === "contact") {
    description = page.content.address ?? page.content.serviceArea ?? page.content.hours;
  }
  return {
    title: `${storefrontPageTitle(pageType)} | ${page.store.display_name}`,
    ...(description ? { description: description.slice(0, 300) } : {}),
  };
}

function PlainText({ children }: { children: string }) {
  return <p>{children}</p>;
}

export function StorefrontInformationPage({
  pageType,
  content,
  storeName,
  templateId,
}: {
  pageType: StorePageType;
  content: StorePageContent;
  storeName: string;
  templateId: string;
}) {
  return (
    <StorefrontPageLayout pageType={pageType} storeName={storeName} templateId={templateId}>
      {content.pageType === "about" && (
        <article className="sf-information-story">
          {content.headline && <h2>{content.headline}</h2>}
          <PlainText>{content.story}</PlainText>
          {content.mediaUrl && <img src={content.mediaUrl} alt={content.mediaAlt ?? ""} />}
        </article>
      )}

      {content.pageType === "contact" && (
        <dl className="sf-information-contact">
          {content.email && <div><dt>Email</dt><dd><a href={`mailto:${content.email}`}>{content.email}</a></dd></div>}
          {content.phone && <div><dt>Phone</dt><dd><a href={`tel:${content.phone.replace(/[^+\d]/g, "")}`}>{content.phone}</a></dd></div>}
          {content.websiteUrl && <div><dt>Website</dt><dd><a href={content.websiteUrl} target="_blank" rel="noreferrer">{content.websiteUrl}</a></dd></div>}
          {content.address && <div><dt>Address</dt><dd><PlainText>{content.address}</PlainText></dd></div>}
          {content.serviceArea && <div><dt>Service area</dt><dd><PlainText>{content.serviceArea}</PlainText></dd></div>}
          {content.hours && <div><dt>Business hours</dt><dd><PlainText>{content.hours}</PlainText></dd></div>}
        </dl>
      )}

      {content.pageType === "faq" && (
        <div className="sf-information-faq">
          {content.items.map((item, index) => (
            <section key={`${index}-${item.question}`}>
              <h2>{item.question}</h2>
              <PlainText>{item.answer}</PlainText>
            </section>
          ))}
        </div>
      )}

      {content.pageType === "shipping_returns" && (
        <div className="sf-information-policy">
          <section><h2>Delivery areas</h2><PlainText>{content.deliveryAreas}</PlainText></section>
          <section><h2>Delivery timing</h2><PlainText>{content.deliveryTime}</PlainText></section>
          <section><h2>Shipping charges</h2><PlainText>{content.shippingCharges}</PlainText></section>
          <section><h2>Return window</h2><PlainText>{content.returnWindow}</PlainText></section>
          <section><h2>Return eligibility</h2><PlainText>{content.returnEligibility}</PlainText></section>
          <section><h2>How to request a return</h2><PlainText>{content.returnSteps}</PlainText></section>
          {content.returnContact && <section><h2>Return contact</h2><PlainText>{content.returnContact}</PlainText></section>}
        </div>
      )}
    </StorefrontPageLayout>
  );
}
