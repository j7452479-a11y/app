import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const token = "a".repeat(64);
const order = {
  id: "order-id",
  organization_id: "org-one",
  order_number: 314,
  state: "processing",
  created_at: "2026-10-15T10:00:00.000Z",
  customer_name: "Private Customer",
  customer_email: "private@example.com",
  customer_phone: "9999999999",
  shipping_address: { city: "Private City" },
  customer_chat_token_hash: "private-hash",
};

function setup({
  matchedOrder = order as typeof order | null,
  organizationId = "org-one",
  plan = "plus",
  available = true,
}: {
  matchedOrder?: typeof order | null;
  organizationId?: string | null;
  plan?: string;
  available?: boolean;
} = {}) {
  const filters: Record<string, Record<string, unknown>> = {};
  const selections: Record<string, string> = {};
  const client = {
    from: vi.fn((table: string) => {
      const query = {
        select: vi.fn((columns: string) => {
          selections[table] = columns;
          return query;
        }),
        eq: vi.fn((column: string, value: unknown) => {
          (filters[table] ??= {})[column] = value;
          return query;
        }),
        maybeSingle: vi.fn(async () => {
          if (table === "orders") return { data: matchedOrder, error: null };
          if (table === "organizations") {
            return {
              data: organizationId ? { id: organizationId } : null,
              error: null,
            };
          }
          if (table === "subscriptions") return { data: { plan }, error: null };
          return { data: null, error: null };
        }),
      };
      return query;
    }),
    rpc: vi.fn(async () => ({ data: available, error: null })),
  };
  vi.mocked(createClient).mockReturnValue(client as never);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://database.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-secret";
  return { client, filters, selections };
}

function request(body: unknown) {
  return new Request("http://localhost/api/customer-order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/customer-order", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid slugs and tokens before resolving an order", async () => {
    setup();

    const invalidToken = await POST(request({ slug: "sample-store", token: "A".repeat(64) }));
    const invalidSlug = await POST(request({ slug: "Sample Store", token }));

    expect(invalidToken.status).toBe(400);
    expect(invalidSlug.status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("does not reveal an order for an unknown token", async () => {
    const { client } = setup({ matchedOrder: null });

    const response = await POST(request({ slug: "sample-store", token }));

    expect(response.status).toBe(404);
    expect(await response.json()).not.toHaveProperty("order");
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("does not reveal an order through another store slug", async () => {
    const { client } = setup({ organizationId: "org-two" });

    const response = await POST(request({ slug: "sample-store", token }));

    expect(response.status).toBe(404);
    expect(await response.json()).not.toHaveProperty("order");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("does not reveal an order when its storefront is unavailable", async () => {
    setup({ available: false });

    const response = await POST(request({ slug: "sample-store", token }));

    expect(response.status).toBe(404);
    expect(await response.json()).not.toHaveProperty("order");
  });

  it("does not reveal an order on the Basic plan", async () => {
    setup({ plan: "basic" });

    const response = await POST(request({ slug: "sample-store", token }));

    expect(response.status).toBe(404);
    expect(await response.json()).not.toHaveProperty("order");
  });

  it.each(["plus", "pro"])("returns minimum tracking data for %s", async (plan) => {
    const { client, filters, selections } = setup({ plan });

    const response = await POST(request({ slug: "sample-store", token }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      order: {
        order_number: order.order_number,
        state: order.state,
        created_at: order.created_at,
      },
    });
    expect(selections.orders).toBe("id,organization_id,order_number,state,created_at");
    expect(filters.orders.customer_chat_token_hash).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(client.rpc).toHaveBeenCalledWith("is_storefront_available", {
      store_slug: "sample-store",
    });
    expect(createClient).toHaveBeenCalledWith(
      "https://database.example",
      "server-only-secret",
      expect.any(Object),
    );
  });

  it("uses no-store responses for rejected capability lookups", async () => {
    setup({ matchedOrder: null });

    const response = await POST(request({ slug: "sample-store", token }));

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
