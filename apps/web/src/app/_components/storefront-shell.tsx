import type { ReactNode } from "react";
import React from "react";
import { isOrderTrackingEnabled } from "@/lib/storefront-utils";
import { getStorefrontTemplate } from "@/lib/storefront-templates";
import { type StorefrontCartProduct } from "@/lib/storefront-stock";
import { StorefrontCartProvider } from "./storefront-cart";
import {
  StorefrontNavigation,
  type StorefrontPageLink,
} from "./storefront-navigation";

export function StorefrontShell({
  slug,
  name,
  template,
  publishedPages,
  plan,
  products,
  children,
}: {
  slug: string;
  name: string;
  template: string;
  publishedPages: StorefrontPageLink[];
  plan: string;
  products: StorefrontCartProduct[];
  children: ReactNode;
}) {
  const design = getStorefrontTemplate(template).design;
  return (
    <StorefrontCartProvider key={slug} storeSlug={slug} products={products}>
      <div
        className={`storefront theme-${template} archetype-${template} storefront-site`}
        data-typography={design.typography}
        data-rhythm={design.rhythm}
        data-density={design.density}
        data-imagery={design.imagery}
        data-motion={design.motion.character}
      >
        <StorefrontNavigation
          slug={slug}
          name={name}
          publishedPages={publishedPages}
          trackingEnabled={isOrderTrackingEnabled(plan)}
        />
        {children}
        <footer className="sf-footer storefront-footer">
          <a href={`/s/${slug}`} className="sf-footer-name">
            {name}
          </a>
          <nav aria-label="Store information">
            {publishedPages.map((page) => {
              const href =
                page.pageType === "shipping_returns"
                  ? `/s/${slug}/policies/shipping-returns`
                  : `/s/${slug}/${page.pageType}`;
              const labels = {
                about: "About",
                contact: "Contact",
                faq: "FAQ",
                shipping_returns: "Shipping & Returns",
              };
              return (
                <a href={href} key={href}>
                  {labels[page.pageType]}
                </a>
              );
            })}
          </nav>
        </footer>
      </div>
    </StorefrontCartProvider>
  );
}
