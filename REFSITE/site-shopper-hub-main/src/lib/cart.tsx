import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getTemplate, type Template } from "@/data/templates";

export type CartLine = { slug: string; qty: number };

type CartValue = {
  lines: CartLine[];
  items: { template: Template; qty: number }[];
  count: number;
  subtotal: number;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "shelf.cart.v1";
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const value = useMemo<CartValue>(() => {
    const items = lines
      .map((l) => {
        const template = getTemplate(l.slug);
        return template ? { template, qty: l.qty } : null;
      })
      .filter((x): x is { template: Template; qty: number } => x !== null);

    return {
      lines,
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.template.price, 0),
      add: (slug) =>
        setLines((prev) =>
          prev.some((l) => l.slug === slug)
            ? prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + 1 } : l))
            : [...prev, { slug, qty: 1 }],
        ),
      remove: (slug) => setLines((prev) => prev.filter((l) => l.slug !== slug)),
      setQty: (slug, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.slug !== slug)
            : prev.map((l) => (l.slug === slug ? { ...l, qty } : l)),
        ),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
