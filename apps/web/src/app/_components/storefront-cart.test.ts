import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/s/north-shop",
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import {
  StorefrontCartProvider,
  useStorefrontCart,
} from "./storefront-cart";
import { StorefrontShell } from "./storefront-shell";
import { resolveStorefrontStock } from "@/lib/storefront-stock";

const catalog = [
  { id: "available", name: "Available", price_paise: 1250, stock: 8 },
  { id: "limited", name: "Limited", price_paise: 500, stock: 2 },
  { id: "bulk", name: "Bulk", price_paise: 250, stock: 50 },
];

let root: Root | undefined;
let host: HTMLDivElement | undefined;

function mount(storeSlug: string, products = catalog) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  let cart: ReturnType<typeof useStorefrontCart>;
  function Capture({ children }: { children?: ReactNode }) {
    cart = useStorefrontCart();
    return createElement("div", null, children);
  }
  act(() => {
    root?.render(
      createElement(StorefrontCartProvider, {
        storeSlug,
        products,
        children: createElement(Capture),
      }),
    );
  });
  return () => cart!;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
  window.localStorage.clear();
});

describe("StorefrontCartProvider", () => {
  it("does not expose the previous cart during a synchronous store switch", () => {
    const observed: { productId: string; quantity: number }[][] = [];
    let currentCart: ReturnType<typeof useStorefrontCart>;
    function Capture() {
      currentCart = useStorefrontCart();
      observed.push(currentCart.items.map((item) => ({ ...item })));
      return null;
    }

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const renderStore = (slug: string) =>
      root?.render(
        createElement(StorefrontShell, {
          slug,
          name: slug,
          template: "essential",
          publishedPages: [],
          plan: "basic",
          products: catalog,
          children: createElement(Capture),
        }),
      );

    act(() => renderStore("north-shop"));
    act(() => currentCart!.addItem("available", 3));
    expect(currentCart!.items).toEqual([
      { productId: "available", quantity: 3 },
    ]);
    window.localStorage.setItem(
      "storefront-cart:south-shop",
      JSON.stringify([{ productId: "available", quantity: 2 }]),
    );

    const switchStart = observed.length;
    act(() => renderStore("south-shop"));
    const duringSwitch = observed.slice(switchStart);
    expect(duringSwitch[0]).toEqual([]);
    expect(currentCart!.items).toEqual([
      { productId: "available", quantity: 2 },
    ]);
  });

  it("uses exact server stock when available and a conservative fallback otherwise", () => {
    expect(resolveStorefrontStock(true)).toBe(1);
    expect(resolveStorefrontStock(false)).toBe(0);
    expect(resolveStorefrontStock(true, 7)).toBe(7);
    expect(resolveStorefrontStock(true, 0)).toBe(0);
    expect(resolveStorefrontStock(true, Number.NaN)).toBe(1);
  });

  it("adds, updates, removes, and clears items", () => {
    const cart = mount("north-shop");
    act(() => cart().addItem("available", 2));
    expect(cart().items).toEqual([{ productId: "available", quantity: 2 }]);
    act(() => cart().setQuantity("available", 4));
    expect(cart().items[0].quantity).toBe(4);
    act(() => cart().removeItem("available"));
    expect(cart().items).toEqual([]);
    act(() => cart().addItem("available"));
    act(() => cart().clear());
    expect(cart().items).toEqual([]);
  });

  it("persists IDs and quantities separately for each store", () => {
    const first = mount("north-shop");
    act(() => first().addItem("available", 3));
    expect(window.localStorage.getItem("storefront-cart:north-shop")).toBe(
      JSON.stringify([{ productId: "available", quantity: 3 }]),
    );
    act(() => root?.unmount());
    root = undefined;
    host?.remove();
    const second = mount("south-shop");
    expect(second().items).toEqual([]);
  });

  it("recovers from corrupt saved data", () => {
    window.localStorage.setItem("storefront-cart:north-shop", "{bad json");
    const cart = mount("north-shop");
    expect(cart().items).toEqual([]);
    expect(window.localStorage.getItem("storefront-cart:north-shop")).toBe(
      "[]",
    );
  });

  it("drops deleted and unavailable products and clamps restored quantities", () => {
    window.localStorage.setItem(
      "storefront-cart:north-shop",
      JSON.stringify([
        { productId: "available", quantity: 99 },
        { productId: "limited", quantity: 1 },
        { productId: "unavailable", quantity: 2 },
        { productId: "deleted", quantity: 1 },
      ]),
    );
    const cart = mount("north-shop", [
      catalog[0],
      catalog[1],
      catalog[2],
      { id: "unavailable", name: "Unavailable", price_paise: 100, stock: 0 },
    ]);
    expect(cart().items).toEqual([
      { productId: "available", quantity: 8 },
      { productId: "limited", quantity: 1 },
    ]);
  });

  it("caps quantities at 20 and at current stock, with a minimum of one", () => {
    const cart = mount("north-shop");
    act(() => cart().addItem("bulk", 30));
    expect(cart().items[0].quantity).toBe(20);
    act(() => cart().setQuantity("bulk", 25));
    expect(cart().items[0].quantity).toBe(20);
    act(() => cart().addItem("available", 30));
    expect(cart().items.find((item) => item.productId === "available")?.quantity).toBe(8);
    act(() => cart().addItem("limited"));
    act(() => cart().setQuantity("limited", 0));
    expect(cart().items.find((item) => item.productId === "limited")?.quantity).toBe(1);
  });

  it("calculates totals from current catalogue prices", () => {
    window.localStorage.setItem(
      "storefront-cart:north-shop",
      JSON.stringify([{ productId: "available", quantity: 2 }]),
    );
    const cart = mount("north-shop", [
      { ...catalog[0], price_paise: 1800 },
    ]);
    expect(cart().totalPaise).toBe(3600);
  });

  it("ignores malformed and unknown cart actions", () => {
    const cart = mount("north-shop");
    act(() => cart().addItem("missing", 1));
    act(() => cart().setQuantity("missing", 2));
    expect(cart().items).toEqual([]);
  });
});
