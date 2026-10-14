"use client";

import React from "react";
import { useState } from "react";
import type { StorefrontProduct } from "./storefront-product-card";
import { useStorefrontCart } from "./storefront-cart";

export function StorefrontProductDetail({
  product,
  storeSlug,
}: {
  product: StorefrontProduct;
  storeSlug: string;
}) {
  const cart = useStorefrontCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart =
    cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(20, product.stock - inCart));

  return (
    <main className="sf-hero sf-product-detail-page">
      <div className="sf-product-image sf-detail-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} fetchPriority="high" />
        ) : (
          <span>No image provided</span>
        )}
      </div>
      <section className="sf-copy" aria-labelledby="product-title">
        <p className="sf-eyebrow">
          <a href={`/s/${storeSlug}/shop`}>Shop</a>
        </p>
        <h1 id="product-title">{product.name}</h1>
        <p className="sf-detail-price">{money(product.price_paise)}</p>
        {product.description && <p>{product.description}</p>}
        <p className="sf-stock" role="status">
          {product.stock > 0 ? "In stock" : "Currently unavailable"}
        </p>
        {product.stock > 0 && (
          <form
            className="sf-form sf-detail-actions"
            onSubmit={(event) => {
              event.preventDefault();
              cart.addItem(product.id, quantity);
              setAdded(true);
            }}
          >
            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={remaining}
                value={quantity}
                onChange={(event) => {
                  const parsed = Number(event.currentTarget.value);
                  if (Number.isInteger(parsed)) {
                    setQuantity(Math.max(1, Math.min(remaining || 1, parsed)));
                  }
                }}
                disabled={remaining < 1}
              />
            </label>
            <button className="sf-cta" type="submit" disabled={remaining < 1}>
              {remaining < 1 ? "Maximum in cart" : "Add to bag"}
            </button>
          </form>
        )}
        {added && (
          <p className="sf-form-message" role="status">
            Added to your cart.
          </p>
        )}
      </section>
    </main>
  );
}

function money(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise) / 100);
}
