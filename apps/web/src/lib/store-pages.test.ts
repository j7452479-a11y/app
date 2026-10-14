import { describe, expect, it } from "vitest";
import {
  isStorePageReady,
  parseStorePageContent,
  type StorePageType,
} from "@/lib/store-pages";

const validContent: Record<StorePageType, Record<string, unknown>> = {
  about: { story: "A family business making durable everyday goods." },
  contact: { email: "hello@example.com", phone: "+1 555 0100" },
  faq: {
    items: [{ question: "How do I place an order?", answer: "Choose a product and complete checkout." }],
  },
  shipping_returns: {
    deliveryAreas: "We deliver within the listed service region.",
    deliveryTime: "Orders usually arrive within five business days.",
    shippingCharges: "Shipping charges are shown at checkout.",
    returnWindow: "Contact us within fourteen days of delivery.",
    returnEligibility: "Unused items in their original packaging are eligible.",
    returnSteps: "Email us with your order number to begin a return.",
  },
};

describe("parseStorePageContent", () => {
  it.each(Object.entries(validContent) as [StorePageType, Record<string, unknown>][])(
    "accepts valid %s content and trims strings",
    (pageType, content) => {
      const input = Object.fromEntries(
        Object.entries(content).map(([key, value]) => [
          key,
          typeof value === "string" ? `  ${value}  ` : value,
        ]),
      );

      expect(parseStorePageContent(pageType, input)).toEqual({
        success: true,
        data: { pageType, ...content },
      });
    },
  );

  it("rejects blank required fields with field-level errors", () => {
    const result = parseStorePageContent("about", { story: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.story).toBeDefined();
    }
  });

  it("validates supplied email and HTTPS website URLs", () => {
    const result = parseStorePageContent("contact", {
      email: "not-an-email",
      websiteUrl: "http://example.com",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeDefined();
      expect(result.errors.websiteUrl).toBeDefined();
    }
  });

  it("rejects unsafe media URLs and markup in merchant text", () => {
    const result = parseStorePageContent("about", {
      story: "A family business making <strong>durable goods</strong>.",
      mediaUrl: "javascript:alert(1)",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.story).toBeDefined();
      expect(result.errors.mediaUrl).toBeDefined();
    }
  });

  it("rejects oversized text", () => {
    const result = parseStorePageContent("about", { story: "x".repeat(5001) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.story).toBeDefined();
    }
  });

  it("rejects incomplete FAQ pairs", () => {
    const result = parseStorePageContent("faq", {
      items: [{ question: "Where is my order?", answer: "  " }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors["items.0.answer"]).toBeDefined();
    }
  });

  it("rejects unsupported page types", () => {
    const result = parseStorePageContent("terms", {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.pageType).toBeDefined();
    }
  });
});

describe("isStorePageReady", () => {
  it("requires page-specific mandatory facts while allowing optional contact fields to be omitted", () => {
    expect(isStorePageReady("about", { headline: "Our story" })).toBe(false);
    expect(isStorePageReady("about", validContent.about)).toBe(true);
    expect(isStorePageReady("contact", {})).toBe(false);
    expect(isStorePageReady("contact", { serviceArea: "Central region" })).toBe(true);
    expect(isStorePageReady("faq", { items: [] })).toBe(false);
    expect(isStorePageReady("faq", validContent.faq)).toBe(true);

    const { returnContact: _returnContact, ...requiredShippingFields } = validContent.shipping_returns;
    expect(isStorePageReady("shipping_returns", requiredShippingFields)).toBe(true);
  });
});
