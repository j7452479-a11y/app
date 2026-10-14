import { describe, expect, it } from "vitest";
import { createProductSlug, isOrderTrackingEnabled } from "@/lib/storefront-utils";

describe("createProductSlug", () => {
  it("normalizes diacritics, punctuation, empty names, and product IDs", () => {
    expect(createProductSlug("  Café au lait / No. 2! ", "ABC-1234-XYZ"))
      .toBe("cafe-au-lait-no-2-abc1234x");
    expect(createProductSlug("!!!", "id-00000001"))
      .toBe("product-id000000");
  });

  it("returns the same readable collision-resistant slug for repeated inputs", () => {
    expect(createProductSlug("Linen Shirt", "prod_01HXYZ2345"))
      .toBe("linen-shirt-prod01hx");
    expect(createProductSlug("Linen Shirt", "prod_01HXYZ2345"))
      .toBe("linen-shirt-prod01hx");
  });
});

describe("isOrderTrackingEnabled", () => {
  it("enables tracking only for Plus and Pro", () => {
    expect(isOrderTrackingEnabled("basic")).toBe(false);
    expect(isOrderTrackingEnabled("plus")).toBe(true);
    expect(isOrderTrackingEnabled("pro")).toBe(true);
  });
});
