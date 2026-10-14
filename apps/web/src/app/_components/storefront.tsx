"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import React from "react";
import Script from "next/script";
import type { ActionState } from "@/app/actions";
import { checkoutStorefront, confirmRazorpayPayment } from "@/app/actions";
import {
  getStorefrontTemplate,
  resolveStorefrontMotion,
} from "@/lib/storefront-templates";
import { OrderChat } from "@/app/_components/order-chat";
import { ShopRecommendations } from "@/app/_components/shop-recommendations";
import { InstallStoreApp } from "@/app/_components/install-store-app";
import { useStorefrontCart } from "@/app/_components/storefront-cart";
import {
  StorefrontProductCard,
  type StorefrontProduct,
} from "@/app/_components/storefront-product-card";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (event: unknown) => void) => void;
    };
  }
}

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);

export function Storefront({
  slug,
  name,
  description,
  template: templateId,
  products,
  paymentEnabled,
  codEnabled,
  recommendationsEnabled,
  appEnabled,
}: {
  slug: string;
  name: string;
  description: string;
  template: string;
  products: StorefrontProduct[];
  paymentEnabled: boolean;
  codEnabled: boolean;
  recommendationsEnabled: boolean;
  appEnabled: boolean;
}) {
  const template = getStorefrontTemplate(templateId);
  const cart = useStorefrontCart();
  const quantities = Object.fromEntries(
    cart.items.map((item) => [item.productId, item.quantity]),
  );
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(checkoutStorefront, {});
  const [scriptReady, setScriptReady] = useState(false);
  const [result, setResult] = useState("");
  const [customerChatToken, setCustomerChatToken] = useState("");
  const [confirming, startTransition] = useTransition();
  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const chosen = products.filter((product) => (quantities[product.id] || 0) > 0);
  const total = cart.totalPaise;

  function animateProductToBag(button: HTMLButtonElement) {
    if (
      typeof window === "undefined" ||
      !button.animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const source = button
      .closest(".sf-product")
      ?.querySelector<HTMLElement>(".sf-product-image");
    const target = document.querySelector<HTMLElement>(".sf-cart-link");
    if (!source || !target) return;

    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motion = resolveStorefrontMotion(template.design.motion, reducedMotion);
    if (!motion.enabled) return;
    const profile = {
      fashion: { lift: 52, rotation: -7 },
      beauty: { lift: 40, rotation: -3 },
      electronics: { lift: 18, rotation: 2 },
      home: { lift: 46, rotation: 2 },
      grocery: { lift: 16, rotation: 0 },
      food: { lift: 36, rotation: 5 },
      artisan: { lift: 48, rotation: -4 },
      luxury: { lift: 58, rotation: 0 },
      local: { lift: 26, rotation: 5 },
      b2b: { lift: 14, rotation: 0 },
      subscription: { lift: 34, rotation: 3 },
      services: { lift: 18, rotation: 0 },
      marketplace: { lift: 30, rotation: 4 },
      essential: { lift: 28, rotation: 2 },
    }[template.id];
    const control = {
      x: dx * 0.5 - (dy / distance) * profile.lift,
      y: dy * 0.5 + (dx / distance) * profile.lift,
    };
    const point = (progress: number) => {
      const rest = 1 - progress;
      return {
        x:
          rest * rest * 0 +
          2 * rest * progress * control.x +
          progress * progress * dx,
        y:
          rest * rest * 0 +
          2 * rest * progress * control.y +
          progress * progress * dy,
      };
    };
    const middle = point(0.55);
    const finalScale = Math.max(0.12, Math.min(0.2, to.width / from.width));
    const ghost = source.cloneNode(true) as HTMLElement;
    const store = button.closest<HTMLElement>(".storefront");
    const storeStyle = store ? getComputedStyle(store) : null;
    ghost.setAttribute("aria-hidden", "true");
    ghost.querySelectorAll("img").forEach((image) => {
      image.alt = "";
    });
    Object.assign(ghost.style, {
      position: "fixed",
      top: `${from.top}px`,
      left: `${from.left}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      margin: "0",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: "60",
      borderRadius: getComputedStyle(source).borderRadius,
    });
    if (storeStyle) {
      ghost.style.setProperty(
        "--sf-bg",
        storeStyle.getPropertyValue("--sf-bg"),
      );
      ghost.style.setProperty(
        "--sf-ink",
        storeStyle.getPropertyValue("--sf-ink"),
      );
      ghost.style.setProperty(
        "--sf-accent",
        storeStyle.getPropertyValue("--sf-accent"),
      );
      ghost.style.setProperty(
        "--sf-wash",
        storeStyle.getPropertyValue("--sf-wash"),
      );
    }
    document.body.appendChild(ghost);
    const animation = ghost.animate(
      [
        {
          transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
          opacity: 1,
          offset: 0,
        },
        {
          transform: `translate3d(${middle.x}px, ${middle.y}px, 0) scale(.62) rotate(${profile.rotation * 0.65}deg)`,
          opacity: 0.94,
          offset: 0.55,
        },
        {
          transform: `translate3d(${dx}px, ${dy}px, 0) scale(${finalScale}) rotate(${profile.rotation}deg)`,
          opacity: 0.16,
          offset: 1,
        },
      ],
      {
        duration: motion.durationMs,
        easing: "cubic-bezier(.22,.75,.25,1)",
        fill: "forwards",
      },
    );
    animation.onfinish = () => ghost.remove();
    animation.oncancel = () => ghost.remove();
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem(`commerce-chat-${slug}`);
    if (savedToken) setCustomerChatToken(savedToken);
  }, [slug]);

  useEffect(() => {
    if (!state.customerChatToken) return;
    setCustomerChatToken(state.customerChatToken);
    window.localStorage.setItem(
      `commerce-chat-${slug}`,
      state.customerChatToken,
    );
  }, [slug, state.customerChatToken]);

  useEffect(() => {
    if (state.message) cart.clear();
  }, [state.message, cart.clear]);

  useEffect(() => {
    if (!state.checkout || !scriptReady || !window.Razorpay) return;
    const data = state.checkout;
    const modal = new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name,
      description: "Order payment",
      order_id: data.orderId,
      prefill: { name: data.name, email: data.email, contact: data.phone },
      theme: { color: "#27664b" },
      handler: (response: unknown) => {
        const payment = response as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        const form = new FormData();
        form.set("local_order_id", data.localOrderId);
        form.set("razorpay_order_id", payment.razorpay_order_id);
        form.set("razorpay_payment_id", payment.razorpay_payment_id);
        form.set("razorpay_signature", payment.razorpay_signature);
        startTransition(async () => {
          const confirmation = await confirmRazorpayPayment({}, form);
          setResult(
            confirmation.message ||
              confirmation.error ||
              "Payment status unavailable.",
          );
          if (confirmation.message) {
            cart.clear();
            setCustomerChatToken(data.customerChatToken);
          }
        });
      },
    });
    modal.on("payment.failed", () =>
      setResult(
        "Payment did not complete. Your reserved items will be released after 20 minutes.",
      ),
    );
    modal.open();
  }, [state.checkout, scriptReady, name, cart.clear]);

  return (
    <main
      id="top"
      className={`storefront theme-${template.id} archetype-${template.id}`}
      data-typography={template.design.typography}
      data-rhythm={template.design.rhythm}
      data-density={template.design.density}
      data-imagery={template.design.imagery}
      data-motion={template.design.motion.character}
    >
      {paymentEnabled && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
          onError={() =>
            setResult(
              "Online checkout could not load. Please retry or choose cash on delivery.",
            )
          }
        />
      )}
      <section className="sf-hero">
        <div className="sf-copy">
          <p className="sf-eyebrow">{template.eyebrow}</p>
          <h1>
            {template.headline.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p>
            {description ||
              template.tone +
                ". Thoughtfully selected and ready to make your own."}
          </p>
          <a className="sf-cta" href="#products">
            {template.collection} <span>↘</span>
          </a>
        </div>
        <div
          className="sf-visual"
          aria-label={`${template.name} storefront artwork`}
        >
          <img
            src={template.image}
            alt={`${template.name} collection`}
            fetchPriority="high"
          />
          <div className="sf-visual-caption">
            <small>{template.name}</small>
            <span>{name}</span>
          </div>
        </div>
      </section>

      <section id="story" className="sf-story">
        <span className="sf-eyebrow">A note from {name}</span>
        <p>
          {description || "Independent by nature. Thoughtful in every detail."}
        </p>
      </section>

      {appEnabled && <InstallStoreApp slug={slug} name={name} />}

      <section id="products" className="sf-products">
        <div className="sf-section-head">
          <div>
            <p className="sf-eyebrow">{template.collection}</p>
            <h2>
              {template.id === "food"
                ? "On the menu"
                : template.id === "services"
                  ? "Ways we can help"
                  : "The collection"}
            </h2>
          </div>
          <p>
            {visibleProducts.length}{" "}
            {visibleProducts.length === 1 ? "item" : "items"}
          </p>
        </div>
        {"search" in template && template.search && (
          <label className="sf-search">
            Find something specific
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${name}`}
            />
          </label>
        )}
        {visibleProducts.length ? (
          <div className="sf-grid">
            {visibleProducts.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                storeSlug={slug}
                onAdd={animateProductToBag}
              />
            ))}
          </div>
        ) : (
          <div className="sf-empty">
            {query
              ? "No items match that search. Try another name."
              : "This collection is being prepared. Check back soon."}
          </div>
        )}
      </section>

      <section id="checkout" className="sf-checkout">
        <div>
          <p className="sf-eyebrow">Your bag</p>
          <h2>
            {template.id === "services" || template.id === "b2b"
              ? "Start a conversation."
              : "Ready when you are."}
          </h2>
          <p className="sf-muted">
            {paymentEnabled
              ? "Pay online securely or choose cash on delivery."
              : "The shop will coordinate payment and delivery after you place your order."}
          </p>
          {chosen.length ? (
            <div className="sf-cart">
              {chosen.map((product) => (
                <div className="sf-cart-row" key={product.id}>
                  <span>
                    {product.name} × {quantities[product.id]}
                  </span>
                  <b>{money(product.price_paise * quantities[product.id])}</b>
                  <button
                    type="button"
                    aria-label={`Remove one ${product.name}`}
                    onClick={() =>
                      quantities[product.id] <= 1
                        ? cart.removeItem(product.id)
                        : cart.setQuantity(product.id, quantities[product.id] - 1)
                    }
                  >
                    −
                  </button>
                </div>
              ))}
              <div className="sf-cart-total">
                <span>Total</span>
                <b>{money(total)}</b>
              </div>
            </div>
          ) : (
            <p className="sf-muted">
              Your bag is empty. Add something from the collection first.
            </p>
          )}
        </div>
        <form className="sf-form" action={action}>
          <input type="hidden" name="slug" value={slug} />
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(
              chosen.map((product) => ({
                product_id: product.id,
                quantity: quantities[product.id],
              })),
            )}
          />
          {paymentEnabled && codEnabled && (
            <label>
              Payment method
              <select name="payment_method" defaultValue="razorpay">
                <option value="razorpay">Pay online</option>
                <option value="cod">Cash on delivery</option>
              </select>
            </label>
          )}
          {paymentEnabled && !codEnabled && (
            <input type="hidden" name="payment_method" value="razorpay" />
          )}
          {!paymentEnabled && (
            <input type="hidden" name="payment_method" value="cod" />
          )}
          <label>
            Your name
            <input
              name="customer_name"
              autoComplete="name"
              required
              minLength={2}
            />
          </label>
          <label>
            Email
            <input
              name="customer_email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Phone (optional)
            <input name="customer_phone" type="tel" autoComplete="tel" />
          </label>
          <label>
            Address
            <input
              name="address"
              autoComplete="street-address"
              required
              minLength={5}
            />
          </label>
          <div className="sf-form-grid">
            <label>
              City
              <input name="city" autoComplete="address-level2" required />
            </label>
            <label>
              PIN code
              <input
                name="postal_code"
                autoComplete="postal-code"
                required
                minLength={4}
              />
            </label>
          </div>
          {state.error && (
            <p className="sf-form-message error" role="alert">
              {state.error}
            </p>
          )}
          {state.message && (
            <p className="sf-form-message" role="status">
              {state.message}
            </p>
          )}
          {result && (
            <p className="sf-form-message" role="status">
              {result}
              {confirming ? " Checking payment…" : ""}
            </p>
          )}
          <button className="sf-cta" disabled={!chosen.length || pending}>
            {pending
              ? "Preparing order…"
              : paymentEnabled
                ? `Continue to checkout · ${money(total)}`
                : `Place order · ${money(total)}`}
          </button>
        </form>
      </section>
      {recommendationsEnabled && (
        <ShopRecommendations slug={slug} products={products} />
      )}
      {customerChatToken && (
        <section className="sf-chat-section">
          <div>
            <p className="sf-eyebrow">ORDER SUPPORT</p>
            <h2>Talk with the shop</h2>
            <p>
              Track order progress and keep questions, photos, and voice notes
              in one private conversation.
            </p>
            <small>
              This private conversation remains available on this device.
            </small>
          </div>
          <OrderChat token={customerChatToken} />
        </section>
      )}
    </main>
  );
}
