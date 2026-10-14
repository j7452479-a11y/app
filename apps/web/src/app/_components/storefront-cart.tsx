"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import React from "react";

export type StorefrontCartProduct = {
  id: string;
  name: string;
  description?: string;
  price_paise: number;
  stock: number;
  image_url?: string | null;
};

export type StorefrontCartItem = { productId: string; quantity: number };

type StorefrontCartValue = {
  items: StorefrontCartItem[];
  setQuantity: (productId: string, quantity: number) => void;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalPaise: number;
};

const StorefrontCartContext = createContext<StorefrontCartValue | null>(null);
const STORAGE_PREFIX = "storefront-cart:";

function clampQuantity(quantity: number, stock: number): number {
  if (!Number.isFinite(quantity) || stock < 1) return 0;
  return Math.max(1, Math.min(20, Math.floor(quantity), Math.floor(stock)));
}

function reconcileItems(
  value: unknown,
  products: StorefrontCartProduct[],
): StorefrontCartItem[] {
  if (!Array.isArray(value)) return [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map<string, number>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.productId !== "string") continue;
    const product = byId.get(candidate.productId);
    if (!product || !Number.isFinite(candidate.quantity)) continue;
    const quantity = clampQuantity(candidate.quantity as number, product.stock);
    if (!quantity) continue;
    quantities.set(
      product.id,
      clampQuantity((quantities.get(product.id) ?? 0) + quantity, product.stock),
    );
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function StorefrontCartProvider({
  storeSlug,
  products,
  children,
}: {
  storeSlug: string;
  products: StorefrontCartProduct[];
  children: ReactNode;
}) {
  const [items, setItems] = useState<StorefrontCartItem[]>([]);
  const [hydratedStore, setHydratedStore] = useState<string | null>(null);
  const storageKey = `${STORAGE_PREFIX}${storeSlug}`;

  useEffect(() => {
    let restored: unknown;
    try {
      const saved = window.localStorage.getItem(storageKey);
      restored = saved ? JSON.parse(saved) : [];
    } catch {
      restored = [];
    }
    setItems(reconcileItems(restored, products));
    setHydratedStore(storeSlug);
  }, [storageKey, storeSlug, products]);

  useEffect(() => {
    if (hydratedStore !== storeSlug) return;
    const reconciled = reconcileItems(items, products);
    if (JSON.stringify(reconciled) !== JSON.stringify(items)) {
      setItems(reconciled);
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(reconciled));
    } catch {
      // The cart remains usable for this visit when browser storage is unavailable.
    }
  }, [hydratedStore, items, products, storageKey, storeSlug]);

  const addItem = useCallback(
    (productId: string, quantity = 1) => {
      const product = products.find((candidate) => candidate.id === productId);
      if (!product || product.stock < 1) return;
      setItems((current) => {
        const existing = current.find((item) => item.productId === productId);
        const nextQuantity = clampQuantity(
          (existing?.quantity ?? 0) + quantity,
          product.stock,
        );
        return existing
          ? current.map((item) =>
              item.productId === productId
                ? { ...item, quantity: nextQuantity }
                : item,
            )
          : [...current, { productId, quantity: nextQuantity }];
      });
    },
    [products],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = products.find((candidate) => candidate.id === productId);
      if (!product || product.stock < 1 || !Number.isFinite(quantity)) return;
      setItems((current) =>
        current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: clampQuantity(quantity, product.stock) }
            : item,
        ),
      );
    },
    [products],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const totalPaise = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return items.reduce(
      (total, item) =>
        total + (byId.get(item.productId)?.price_paise ?? 0) * item.quantity,
      0,
    );
  }, [items, products]);

  const value = useMemo(
    () => ({ items, setQuantity, addItem, removeItem, clear, totalPaise }),
    [items, setQuantity, addItem, removeItem, clear, totalPaise],
  );

  return (
    <StorefrontCartContext.Provider value={value}>
      {children}
    </StorefrontCartContext.Provider>
  );
}

export function useStorefrontCart(): StorefrontCartValue {
  const cart = useContext(StorefrontCartContext);
  if (!cart) {
    throw new Error("useStorefrontCart must be used inside StorefrontCartProvider");
  }
  return cart;
}
