import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  resolveStorefrontMotion,
  storefrontTemplates,
} from "./storefront-templates";

describe("storefront design profiles", () => {
  it("gives every existing sector a complete and distinct visual profile", () => {
    expect(storefrontTemplates).toHaveLength(14);
    expect(storefrontTemplates.map((template) => template.id)).toEqual([
      "essential",
      "fashion",
      "beauty",
      "electronics",
      "home",
      "grocery",
      "food",
      "artisan",
      "luxury",
      "local",
      "b2b",
      "subscription",
      "services",
      "marketplace",
    ]);
    const dimensions = [
      "typography",
      "rhythm",
      "density",
      "imagery",
      "motion",
    ] as const;

    for (const dimension of dimensions) {
      const values = storefrontTemplates.map((template) =>
        dimension === "motion"
          ? template.design?.motion.character
          : template.design?.[dimension],
      );
      expect(values.every(Boolean), `${dimension} is complete`).toBe(true);
      expect(new Set(values).size, `${dimension} is unique`).toBe(14);
    }
  });

  it("references an existing sector image for every template", () => {
    const webRoot = resolve(__dirname, "../..");

    for (const template of storefrontTemplates) {
      expect(template.image).toMatch(/^\/templates\/sector-[\w-]+\.jpg$/);
      expect(existsSync(resolve(webRoot, "public", template.image.slice(1)))).toBe(
        true,
      );
    }
  });

  it("uses neutral food, artisan, and luxury default copy", () => {
    const claimPattern = /\b(fresh|freshly|durable|last|lifetime|forever)\b/i;
    const copyById = new Map(
      storefrontTemplates.map((template) => [template.id, template]),
    );

    for (const id of ["food", "artisan", "luxury"] as const) {
      const template = copyById.get(id)!;
      expect(`${template.eyebrow} ${template.headline}`).not.toMatch(
        claimPattern,
      );
    }
    expect(copyById.get("food")?.eyebrow).toBe("Food & drink");
    expect(copyById.get("artisan")?.eyebrow).toBe("Makers & materials");
    expect(copyById.get("luxury")?.eyebrow).toBe("Luxury goods & design");
  });

  it("keeps every product image ratio in the final storefront CSS overrides", () => {
    const css = readFileSync(
      resolve(__dirname, "../app/features.css"),
      "utf8",
    );
    const finalOverrides = css.split(
      "/* Keep each sector's product crop after the shared storefront image rules. */",
    )[1];
    const ratios: Record<(typeof storefrontTemplates)[number]["id"], string> = {
      essential: "1 / 1.05",
      fashion: "4 / 5",
      beauty: "1 / 1.12",
      electronics: "1 / 1",
      home: "1 / 1.12",
      grocery: "1 / .94",
      food: "1",
      artisan: "1 / 1.08",
      luxury: "1 / 1.08",
      local: "1 / 1",
      b2b: "1 / .9",
      subscription: "1 / 1",
      services: "1 / .82",
      marketplace: "1 / .94",
    };

    expect(finalOverrides).toBeDefined();
    for (const template of storefrontTemplates) {
      expect(finalOverrides).toContain(
        `.storefront.archetype-${template.id} .sf-product-image { aspect-ratio: ${ratios[template.id]}; height: auto; }`,
      );
    }
  });

  it("resolves every motion profile to no animation under reduced motion", () => {
    for (const template of storefrontTemplates) {
      const standardMotion = resolveStorefrontMotion(
        template.design.motion,
        false,
      );
      expect(standardMotion).toEqual({
        character: template.design.motion.character,
        enabled: true,
        durationMs: template.design.motion.durationMs,
        ambient: template.design.motion.ambient,
      });
      const motion = resolveStorefrontMotion(template.design.motion, true);
      expect(motion).toEqual({
        character: template.design.motion.character,
        enabled: false,
        durationMs: 0,
        ambient: false,
      });
    }
  });
});
