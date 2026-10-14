import { describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  findPublishedProduct,
  filterAndSortProducts,
  type StorefrontCatalogProduct,
} from "@/app/_components/storefront-catalog";
import { StorefrontCartProvider, useStorefrontCart } from "@/app/_components/storefront-cart";
import { StorefrontProductDetail } from "@/app/_components/storefront-product-detail";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const products: StorefrontCatalogProduct[] = [
  {
    id: "p2",
    organization_id: "store-a",
    slug: "linen-shirt-p2",
    status: "published",
    name: "Linen Shirt",
    description: "Natural woven fabric",
    price_paise: 250000,
    stock: 3,
    image_url: null,
  },
  {
    id: "p1",
    organization_id: "store-a",
    slug: "cotton-shirt-p1",
    status: "published",
    name: "Cotton Shirt",
    description: "Soft everyday fabric",
    price_paise: 180000,
    stock: 0,
    image_url: null,
  },
  {
    id: "draft",
    organization_id: "store-a",
    slug: "draft-item",
    status: "draft",
    name: "Draft Item",
    description: "Not public",
    price_paise: 1,
    stock: 12,
    image_url: null,
  },
  {
    id: "other-store",
    organization_id: "store-b",
    slug: "linen-shirt-other-store",
    status: "published",
    name: "Other Store Item",
    description: "Private to another tenant",
    price_paise: 1,
    stock: 12,
    image_url: null,
  },
];

describe("storefront product routing and catalogue", () => {
  it("resolves only published products in the requested tenant by persisted slug", () => {
    expect(findPublishedProduct(products, "store-a", "linen-shirt-p2")?.id).toBe("p2");
    expect(findPublishedProduct(products, "store-a", "draft-item")).toBeNull();
    expect(
      findPublishedProduct(products, "store-a", "linen-shirt-other-store"),
    ).toBeNull();
    expect(findPublishedProduct(products, "store-a", "missing")).toBeNull();
  });

  it("searches only supported name and description fields and filters stock", () => {
    const results = filterAndSortProducts(products, {
      query: "woven",
      inStockOnly: true,
      sort: "name",
    });
    expect(results.map((product) => product.id)).toEqual(["p2"]);
    expect(
      filterAndSortProducts(products, {
        query: "not public",
        inStockOnly: false,
        sort: "name",
      }),
    ).toEqual([]);
  });

  it("sorts deterministically by name or price with stable tie breakers", () => {
    expect(
      filterAndSortProducts(products, {
        query: "shirt",
        inStockOnly: false,
        sort: "price-asc",
      }).map((product) => product.id),
    ).toEqual(["p1", "p2"]);
    expect(
      filterAndSortProducts(products, {
        query: "shirt",
        inStockOnly: false,
        sort: "name",
      }).map((product) => product.id),
    ).toEqual(["p1", "p2"]);
  });

  it("adds a product from its detail page to the shared ID-and-quantity cart", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root: Root = createRoot(host);
    function CartCount() {
      const cart = useStorefrontCart();
      return createElement("output", { "data-testid": "cart-count" }, cart.items[0]?.quantity ?? 0);
    }

    act(() => {
      root.render(
        createElement(
          StorefrontCartProvider,
          {
            storeSlug: "north-shop",
            products: [products[0]],
            children: createElement(
              "div",
              null,
              createElement(StorefrontProductDetail, {
                storeSlug: "north-shop",
                product: products[0],
              }),
              createElement(CartCount),
            ),
          },
        ),
      );
    });
    const button = host.querySelector<HTMLButtonElement>("button[type=submit]");
    expect(button).not.toBeNull();
    act(() => button?.click());
    expect(host.querySelector("[data-testid=cart-count]")?.textContent).toBe("1");
    act(() => root.unmount());
    host.remove();
  });
});
