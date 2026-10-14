import { describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  getPublishedStorePage,
  StorefrontInformationPage,
} from "@/app/_components/storefront-information-page";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function makeClient({
  available = true,
  organization = { id: "org-1" },
  store = { display_name: "North Shop", template: "local" },
  publishedContent,
}: {
  available?: boolean;
  organization?: { id: string } | null;
  store?: { display_name: string; template: string } | null;
  publishedContent?: Record<string, unknown> | null;
} = {}) {
  const selects: string[] = [];
  const client = {
    rpc: vi.fn(async () => ({ data: available })),
    from: vi.fn((table: string) => {
      const filters: Record<string, unknown> = {};
      const query = {
        select(columns: string) {
          selects.push(`${table}:${columns}`);
          return query;
        },
        eq(column: string, value: unknown) {
          filters[column] = value;
          return query;
        },
        maybeSingle: async () => {
          if (table === "organizations") return { data: organization };
          if (table === "stores") return { data: store };
          if (table === "store_pages") {
            return {
              data: filters.organization_id === "org-1" && filters.page_type
                ? { published_content: publishedContent ?? null }
                : null,
            };
          }
          return { data: null };
        },
      };
      return query;
    }),
  };
  return { client, selects };
}

function renderPage(props: Parameters<typeof StorefrontInformationPage>[0]) {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);
  act(() => root.render(createElement(StorefrontInformationPage, props)));
  return {
    host,
    cleanup() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe("public storefront information pages", () => {
  it("requires an available store and fetches only its published snapshot", async () => {
    const { client, selects } = makeClient({
      publishedContent: { story: "Details supplied by this merchant." },
    });

    const result = await getPublishedStorePage(client as never, "north-shop", "about");

    expect(result).toMatchObject({
      organizationId: "org-1",
      store: { display_name: "North Shop", template: "local" },
      content: {
        pageType: "about",
        story: "Details supplied by this merchant.",
      },
    });
    expect(client.rpc).toHaveBeenCalledWith("is_storefront_available", {
      store_slug: "north-shop",
    });
    expect(selects).toContain("store_pages:published_content");
    expect(selects).not.toContain("store_pages:content");
    expect(selects.some((selection) => selection.startsWith("store_pages:") && selection !== "store_pages:published_content")).toBe(false);
  });

  it.each([
    ["unavailable store", { available: false, publishedContent: { story: "Published text." } }],
    ["missing organization", { organization: null, publishedContent: { story: "Published text." } }],
    ["missing store", { store: null, publishedContent: { story: "Published text." } }],
    ["missing page", {}],
    ["unpublished page", { publishedContent: null }],
    ["invalid published content", { publishedContent: { story: "<script>draft()</script>" } }],
  ])("does not return a page for %s", async (_label, options) => {
    const { client } = makeClient(options);
    await expect(
      getPublishedStorePage(client as never, "north-shop", "about"),
    ).resolves.toBeNull();
  });

  it("omits absent optional contact values and renders supplied contact actions", () => {
    const view = renderPage({
      pageType: "contact",
      content: { pageType: "contact", email: "hello@example.com", address: "14 Market Road" },
      storeName: "North Shop",
      templateId: "local",
    });
    expect(view.host.textContent).toContain("hello@example.com");
    expect(view.host.textContent).toContain("14 Market Road");
    expect(view.host.querySelector('a[href="mailto:hello@example.com"]')).not.toBeNull();
    expect(view.host.textContent).not.toContain("Phone");
    expect(view.host.textContent).not.toContain("Business hours");
    view.cleanup();
  });

  it("renders merchant FAQ pairs as semantic questions and answers without interpreting markup", () => {
    const view = renderPage({
      pageType: "faq",
      content: {
        pageType: "faq",
        items: [{ question: "When does it ship?", answer: "<b>See the order details.</b>" }],
      },
      storeName: "North Shop",
      templateId: "local",
    });
    expect(view.host.querySelector("h1")?.textContent).toBe("FAQ");
    expect(view.host.querySelector("h2")?.textContent).toBe("When does it ship?");
    expect(view.host.querySelector("b")).toBeNull();
    expect(view.host.textContent).toContain("<b>See the order details.</b>");
    view.cleanup();
  });

  it("renders every supplied shipping and returns field, with no generic policy text", () => {
    const view = renderPage({
      pageType: "shipping_returns",
      content: {
        pageType: "shipping_returns",
        deliveryAreas: "Coastal region",
        deliveryTime: "Timing shown at checkout",
        shippingCharges: "Charges shown before payment",
        returnWindow: "Contact within 9 days",
        returnEligibility: "Unopened products",
        returnSteps: "Email the order reference",
      },
      storeName: "North Shop",
      templateId: "local",
    });
    for (const value of [
      "Coastal region",
      "Timing shown at checkout",
      "Charges shown before payment",
      "Contact within 9 days",
      "Unopened products",
      "Email the order reference",
    ]) expect(view.host.textContent).toContain(value);
    expect(view.host.textContent).not.toContain("business days");
    expect(view.host.textContent).not.toContain("refund");
    view.cleanup();
  });
});
