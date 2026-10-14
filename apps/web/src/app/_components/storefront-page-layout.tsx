import type { ReactNode } from "react";
import React from "react";
import { getStorefrontTemplate } from "@/lib/storefront-templates";
import type { StorePageType } from "@/lib/store-pages";

const pageTitles: Record<StorePageType, string> = {
  about: "About",
  contact: "Contact",
  faq: "FAQ",
  shipping_returns: "Shipping & Returns",
};

export function storefrontPageTitle(pageType: StorePageType) {
  return pageTitles[pageType];
}

export function StorefrontPageLayout({
  pageType,
  storeName,
  templateId,
  children,
}: {
  pageType: StorePageType;
  storeName: string;
  templateId: string;
  children: ReactNode;
}) {
  const template = getStorefrontTemplate(templateId);
  return (
    <main className={`sf-information-page theme-${template.id}`}>
      <header className="sf-information-heading">
        <p className="sf-information-eyebrow">{storeName}</p>
        <h1>{pageTitles[pageType]}</h1>
      </header>
      <div className={`sf-information-content sf-information-${pageType}`}>
        {children}
      </div>
    </main>
  );
}
