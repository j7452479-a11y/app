"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { useStorefrontCart } from "./storefront-cart";

export type StorefrontPageLink = {
  pageType: "about" | "contact" | "faq" | "shipping_returns";
};

const pageLabels: Record<StorefrontPageLink["pageType"], string> = {
  about: "About",
  contact: "Contact",
  faq: "FAQ",
  shipping_returns: "Shipping & Returns",
};

export function StorefrontNavigation({
  slug,
  name,
  publishedPages,
  trackingEnabled,
}: {
  slug: string;
  name: string;
  publishedPages: StorefrontPageLink[];
  trackingEnabled: boolean;
}) {
  const pathname = usePathname();
  const { items } = useStorefrontCart();
  const base = `/s/${slug}`;
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const links = [
    { href: base, label: "Home", current: pathname === base },
    {
      href: `${base}/shop`,
      label: "Shop",
      current: pathname === `${base}/shop` || pathname.startsWith(`${base}/products/`),
    },
    ...publishedPages.map((page) => ({
      href:
        page.pageType === "shipping_returns"
          ? `${base}/policies/shipping-returns`
          : `${base}/${page.pageType}`,
      label: pageLabels[page.pageType],
      current:
        pathname ===
        (page.pageType === "shipping_returns"
          ? `${base}/policies/shipping-returns`
          : `${base}/${page.pageType}`),
    })),
    ...(trackingEnabled
      ? [
          {
            href: `${base}/orders/track`,
            label: "Track order",
            current: pathname === `${base}/orders/track`,
          },
        ]
      : []),
  ];

  return (
    <header className="sf-nav storefront-navigation">
      <a href={base} className="sf-logo" aria-label={`${name} home`}>
        {name}
      </a>
      <nav aria-label="Store navigation">
        {links.map((link) => (
          <a
            href={link.href}
            key={link.href}
            aria-current={link.current ? "page" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <a
        href={`${base}#checkout`}
        className="sf-nav-link sf-cart-link"
        aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      >
        Cart <span aria-hidden="true">{itemCount}</span>
      </a>
    </header>
  );
}
