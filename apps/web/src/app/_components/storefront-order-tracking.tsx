"use client";

import { useEffect, useState } from "react";

type TrackedOrder = {
  order_number: number;
  state: string;
  created_at: string;
};

export function StorefrontOrderTracking({ slug }: { slug: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("Looking for an order on this device…");

  useEffect(() => {
    const savedToken = window.localStorage.getItem(`commerce-chat-${slug}`);
    if (savedToken) {
      setToken(savedToken);
      return;
    }
    setMessage("No saved order link was found on this device. Open the store on the device used to place your order.");
  }, [slug]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function loadOrder() {
      try {
        const response = await fetch("/api/customer-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ slug, token }),
        });
        const result = await response.json() as { order?: TrackedOrder };
        if (cancelled) return;
        if (response.ok && result.order) {
          setOrder(result.order);
          setMessage("");
        } else {
          setMessage("Order tracking is unavailable for this store or saved order link.");
        }
      } catch {
        if (!cancelled) setMessage("Order status could not be loaded. Please try again.");
      }
    }
    void loadOrder();
    return () => { cancelled = true; };
  }, [slug, token]);

  return (
    <main className="sf-page storefront-order-tracking">
      <p className="sf-eyebrow">ORDER STATUS</p>
      <h1>Track your order</h1>
      {order ? (
        <section className="sf-card" aria-live="polite">
          <h2>Order #{order.order_number}</h2>
          <p>Status: {order.state.replaceAll("_", " ")}</p>
          <p>Placed {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </section>
      ) : (
        <p role="status" aria-live="polite">{message}</p>
      )}
      <p className="sf-muted">Your order link stays on this device and is sent securely to look up its status.</p>
    </main>
  );
}
