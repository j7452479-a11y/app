import type { StorefrontProduct } from "@/app/_components/storefront-product-card";

export type StorefrontCatalogProduct = StorefrontProduct & {
  organization_id: string;
  status: string;
  is_in_stock?: boolean;
};

export type CatalogSort = "name" | "price-asc" | "price-desc";

export function findPublishedProduct(
  products: StorefrontCatalogProduct[],
  organizationId: string,
  productSlug: string,
): StorefrontCatalogProduct | null {
  return (
    products.find(
      (product) =>
        product.organization_id === organizationId &&
        product.status === "published" &&
        product.slug === productSlug,
    ) ?? null
  );
}

export function filterAndSortProducts(
  products: StorefrontCatalogProduct[],
  options: { query: string; inStockOnly: boolean; sort: CatalogSort },
): StorefrontCatalogProduct[] {
  const query = options.query.trim().toLocaleLowerCase();
  return products
    .filter(
      (product) =>
        product.status === "published" &&
        (!query ||
          `${product.name} ${product.description}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (!options.inStockOnly || product.stock > 0),
    )
    .toSorted((left, right) => {
      if (options.sort === "name") {
        return (
          left.name.localeCompare(right.name, undefined, {
            sensitivity: "base",
          }) || left.id.localeCompare(right.id)
        );
      }
      const priceOrder = left.price_paise - right.price_paise;
      return (options.sort === "price-asc" ? priceOrder : -priceOrder) ||
        left.id.localeCompare(right.id);
    });
}
