import { describe, expect, it } from "vitest";
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
