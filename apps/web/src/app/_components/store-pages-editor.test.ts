import { describe, expect, it } from "vitest";
import { hasUnsavedStorePageChanges } from "@/app/_components/store-pages-editor";

describe("store page publish draft comparison", () => {
  it("treats normalized draft fields as unchanged from the saved content", () => {
    expect(hasUnsavedStorePageChanges(
      "about",
      { story: "  A studio creating useful everyday objects.  ", headline: "" },
      { story: "A studio creating useful everyday objects." },
    )).toBe(false);
  });

  it("marks edited or unsaved page content as dirty", () => {
    expect(hasUnsavedStorePageChanges(
      "about",
      { story: "A studio creating useful everyday objects, by hand." },
      { story: "A studio creating useful everyday objects." },
    )).toBe(true);

    expect(hasUnsavedStorePageChanges(
      "about",
      { story: "A studio creating useful everyday objects." },
      null,
    )).toBe(true);
  });
});
