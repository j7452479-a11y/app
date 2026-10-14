"use client";

import React from "react";
import { useMemo, useState } from "react";
import {
  filterAndSortProducts,
  type CatalogSort,
  type StorefrontCatalogProduct,
} from "@/lib/storefront-catalog";
import { StorefrontProductCard } from "./storefront-product-card";

export type { StorefrontCatalogProduct } from "@/lib/storefront-catalog";

export function StorefrontCatalog({
  products,
  storeSlug,
  storeName,
}: {
  products: StorefrontCatalogProduct[];
  storeSlug: string;
  storeName: string;
}) {
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<CatalogSort>("name");
  const visibleProducts = useMemo(
    () => filterAndSortProducts(products, { query, inStockOnly, sort }),
    [products, query, inStockOnly, sort],
  );

  return (
    <main className="sf-products sf-catalog" id="catalog">
      <div className="sf-section-head">
        <div>
          <p className="sf-eyebrow">Shop</p>
          <h1>{storeName}</h1>
        </div>
        <p>
          {visibleProducts.length} {visibleProducts.length === 1 ? "item" : "items"}
        </p>
      </div>
      <div
        className="sf-catalog-controls sf-form"
        aria-label="Catalogue controls"
      >
        <label className="sf-search">
          Search products
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={`Search ${storeName}`}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.currentTarget.checked)}
          />{" "}
          In stock only
        </label>
        <label>
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.currentTarget.value as CatalogSort)}
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
      {visibleProducts.length ? (
        <div className="sf-grid">
          {visibleProducts.map((product) => (
            <StorefrontProductCard
              key={product.id}
              product={product}
              storeSlug={storeSlug}
            />
          ))}
        </div>
      ) : (
        <p className="sf-empty" role="status">
          {query || inStockOnly
            ? "No products match these filters."
            : "No published products are available yet."}
        </p>
      )}
    </main>
  );
}
