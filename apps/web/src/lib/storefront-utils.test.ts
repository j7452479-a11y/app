import { describe, expect, it } from "vitest";
import { createProductSlug, isOrderTrackingEnabled } from "@/lib/storefront-utils";

describe("createProductSlug", () => {
  it("normalizes diacritics, punctuation, empty names, and product IDs", () => {
    expect(createProductSlug("  Café au lait / No. 2! ", "ABC-1234-XYZ"))
      .toBe("cafe-au-lait-no-2-abc1234xyz");
    expect(createProductSlug("!!!", "id-00000001"))
      .toBe("product-id00000001");
  });

  it("returns the same readable collision-resistant slug for repeated inputs", () => {
    expect(createProductSlug("Linen Shirt", "prod_01HXYZ2345"))
      .toBe("linen-shirt-prod01hxyz2345");
    expect(createProductSlug("Linen Shirt", "prod_01HXYZ2345"))
      .toBe("linen-shirt-prod01hxyz2345");
  });

  it("distinguishes duplicate names whose UUIDs share the old eight-character prefix", () => {
    expect(createProductSlug("Linen Shirt", "01234567-89ab-cdef-0123-456789abcdef"))
      .toBe("linen-shirt-0123456789abcdef0123456789abcdef");
    expect(createProductSlug("Linen Shirt", "01234567-89ab-cdef-fedc-ba9876543210"))
      .toBe("linen-shirt-0123456789abcdeffedcba9876543210");
  });

  it("bounds long readable names and trims a hyphen at the truncation boundary", () => {
    const slug = createProductSlug(
      `${"a".repeat(179)} ${"tail".repeat(100)}`,
      "71234567-89ab-cdef-0123-456789abcdef",
    );

    expect(slug).toBe(`${"a".repeat(179)}-7123456789abcdef0123456789abcdef`);
    expect(slug).toHaveLength(212);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slug.length).toBeLessThanOrEqual(2048);
  });
});

describe("isOrderTrackingEnabled", () => {
  it("enables tracking only for Plus and Pro", () => {
    expect(isOrderTrackingEnabled("basic")).toBe(false);
    expect(isOrderTrackingEnabled("plus")).toBe(true);
    expect(isOrderTrackingEnabled("pro")).toBe(true);
  });
});
