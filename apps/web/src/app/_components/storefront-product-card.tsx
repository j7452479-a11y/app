"use client";

import React from "react";
import type { StorefrontCartProduct } from "@/lib/storefront-stock";
import { useStorefrontCart } from "./storefront-cart";

export type StorefrontProduct = Omit<StorefrontCartProduct, "description"> & {
  description: string;
  slug: string;
};

export function StorefrontProductCard({
  product,
  storeSlug,
  onAdd,
}: {
  product: StorefrontProduct;
  storeSlug: string;
  onAdd?: (button: HTMLButtonElement) => void;
}) {
  const cart = useStorefrontCart();
  const quantity =
    cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;

  return (
    <article className="sf-product">
      <a
        className="sf-product-image"
        href={`/s/${storeSlug}/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <span>No image provided</span>
        )}
      </a>
      <div className="sf-product-detail">
        <div>
          <h3>
            <a href={`/s/${storeSlug}/products/${product.slug}`}>
              {product.name}
            </a>
          </h3>
          {product.description && <p>{product.description}</p>}
        </div>
        <strong>{money(product.price_paise)}</strong>
      </div>
      <div className="sf-stock" aria-live="polite">
        {product.stock > 0 ? "In stock" : "Currently unavailable"}
      </div>
      <button
        className="sf-add"
        type="button"
        disabled={product.stock < 1 || quantity >= product.stock}
        onClick={(event) => {
          onAdd?.(event.currentTarget);
          cart.addItem(product.id);
        }}
      >
        {product.stock < 1
          ? "Unavailable"
          : quantity
            ? `Add another · ${quantity} in bag`
            : "Add to bag +"}
      </button>
    </article>
  );
}

function money(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise) / 100);
}
