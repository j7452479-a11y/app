import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveStorePage, setStorePagePublished } from "@/app/store/pages/actions";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

type Page = {
  organization_id: string;
  page_type: string;
  content: Record<string, unknown>;
  published_content: Record<string, unknown> | null;
  published_at: string | null;
  updated_at: string;
  revision: number;
};

function createDatabase({
  userId = "user-one",
  role = "owner",
  subscriptionState = "active",
  organizations = ["org-one"],
  pages = [] as Page[],
  bumpRevisionBeforeUpdate = false,
}: {
  userId?: string | null;
  role?: string;
  subscriptionState?: string;
  organizations?: string[];
  pages?: Page[];
  bumpRevisionBeforeUpdate?: boolean;
} = {}) {
  const rows = new Map(pages.map((page) => [`${page.organization_id}:${page.page_type}`, structuredClone(page)]));
  const writes: { table: string; values: Record<string, unknown> }[] = [];
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from(table: string) {
      let filters: Record<string, unknown> = {};
      let operation: "read" | "upsert" | "update" = "read";
      let values: Record<string, unknown> = {};
      const builder: Record<string, unknown> = {
        select: () => builder,
        limit: () => builder,
        maybeSingle: async () => {
          if (table === "memberships") {
            return organizations.length
              ? { data: { organization_id: organizations[0], role } }
              : { data: null };
          }
          if (table === "subscriptions") {
            return { data: { state: subscriptionState, trial_started_at: null, trial_ends_at: null } };
          }
          if (table === "store_pages") {
            if (operation === "update") {
              const key = `${filters.organization_id}:${filters.page_type}`;
              let current = rows.get(key);
              if (!current) return { data: null };
              if (bumpRevisionBeforeUpdate) {
                current = { ...current, content: { story: "A newer story saved by another tab." }, revision: current.revision + 1 };
                rows.set(key, current);
              }
              if (filters.revision !== undefined && current.revision !== filters.revision) return { data: null };
              const updated = { ...current, ...values, revision: current.revision + 1 };
              rows.set(key, updated);
              writes.push({ table, values: structuredClone(values) });
              return { data: updated };
            }
            return { data: rows.get(`${filters.organization_id}:${filters.page_type}`) ?? null };
          }
          return { data: null };
        },
        upsert: (nextValues: Record<string, unknown>) => {
          operation = "upsert";
          values = nextValues;
          return builder;
        },
        update: (nextValues: Record<string, unknown>) => {
          operation = "update";
          values = nextValues;
          return builder;
        },
        eq: (column: string, value: unknown) => {
          filters[column] = value;
          return builder;
        },
        then: (resolve: (value: { error: null }) => unknown) => {
          if (operation === "upsert") {
            const key = `${values.organization_id}:${values.page_type}`;
            const current = rows.get(key);
            rows.set(key, { ...current, ...values, revision: current ? current.revision + 1 : 1 } as Page);
          } else if (operation === "update") {
            const key = `${filters.organization_id}:${filters.page_type}`;
            const current = rows.get(key);
            if (current) rows.set(key, { ...current, ...values });
          }
          if (operation !== "read") writes.push({ table, values: structuredClone(values) });
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return builder;
    },
  };
  return { client, rows, writes };
}

function pageForm(pageType: string, content: unknown, extra: Record<string, string> = {}) {
  const form = new FormData();
  form.set("page_type", pageType);
  form.set("content", typeof content === "string" ? content : JSON.stringify(content));
  for (const [key, value] of Object.entries(extra)) form.set(key, value);
  return form;
}

function publicationForm(pageType: string, expectedContent: unknown, action: "publish" | "unpublish") {
  const form = new FormData();
  form.set("page_type", pageType);
  form.set("action", action);
  if (action === "publish") form.set("expected_content", JSON.stringify(expectedContent));
  return form;
}

const aboutDraft = { story: "A small studio making useful objects for daily life." };
const liveAbout: Page = {
  organization_id: "org-one",
  page_type: "about",
  content: { story: "Earlier draft from this studio." },
  published_content: { story: "The story currently shown to customers." },
  published_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
  revision: 1,
};

describe("store page actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated draft saves and publishes", async () => {
    const db = createDatabase({ userId: null, pages: [liveAbout] });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    expect(await saveStorePage(pageForm("about", aboutDraft))).toMatchObject({ error: expect.any(String) });
    expect(await setStorePagePublished(publicationForm("about", aboutDraft, "publish"))).toMatchObject({ error: expect.any(String) });
    expect(db.writes).toEqual([]);
  });

  it("rejects invalid JSON and schema-invalid draft content with field errors", async () => {
    const db = createDatabase();
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const invalidJson = await saveStorePage(pageForm("about", "{"));
    const invalidContent = await saveStorePage(pageForm("about", { story: "  " }));

    expect(invalidJson.errors?.content).toBeDefined();
    expect(invalidContent.errors?.story).toBeDefined();
    expect(db.writes).toEqual([]);
  });

  it("rejects unsupported page types before writing", async () => {
    const db = createDatabase();
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await saveStorePage(pageForm("terms", {}));

    expect(result.errors?.page_type).toBeDefined();
    expect(db.writes).toEqual([]);
  });

  it("requires an editor role and an unlocked workspace", async () => {
    const staff = createDatabase({ role: "staff" });
    vi.mocked(createClient).mockResolvedValue(staff.client as never);
    expect(await saveStorePage(pageForm("about", aboutDraft))).toMatchObject({ error: expect.any(String) });
    expect(staff.writes).toEqual([]);

    const locked = createDatabase({ subscriptionState: "suspended" });
    vi.mocked(createClient).mockResolvedValue(locked.client as never);
    expect(await saveStorePage(pageForm("about", aboutDraft))).toMatchObject({ error: expect.any(String) });
    expect(locked.writes).toEqual([]);
  });

  it("saves only draft content for the server-resolved organization", async () => {
    const otherTenant: Page = { ...liveAbout, organization_id: "org-two", content: { story: "Another tenant draft." } };
    const db = createDatabase({ pages: [liveAbout, otherTenant], organizations: ["org-one", "org-two"] });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await saveStorePage(pageForm("about", aboutDraft, {
      organization_id: "org-two",
      published_content: JSON.stringify({ story: "Attacker supplied publication." }),
    }));

    expect(result).toEqual({ message: expect.any(String) });
    expect(db.rows.get("org-one:about")).toMatchObject({
      content: aboutDraft,
      published_content: liveAbout.published_content,
      published_at: liveAbout.published_at,
    });
    expect(db.rows.get("org-two:about")?.content).toEqual(otherTenant.content);
    expect(db.writes).toEqual([{
      table: "store_pages",
      values: { organization_id: "org-one", page_type: "about", content: aboutDraft },
    }]);
  });

  it("does not publish an incomplete draft", async () => {
    const incomplete: Page = { ...liveAbout, content: { story: "Short" } };
    const db = createDatabase({ pages: [incomplete] });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await setStorePagePublished(publicationForm("about", incomplete.content, "publish"));

    expect(result.errors?.story).toBeDefined();
    expect(db.writes).toEqual([]);
    expect(db.rows.get("org-one:about")?.published_content).toEqual(liveAbout.published_content);
  });

  it("rejects publishing when the persisted draft changed after this tab previewed it", async () => {
    const latestDraft = { story: "A newly revised studio story with different details." };
    const db = createDatabase({ pages: [{ ...liveAbout, content: latestDraft }] });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await setStorePagePublished(publicationForm("about", aboutDraft, "publish"));

    expect(result.errors?._form?.[0]).toMatch(/changed.*refresh|refresh.*review/i);
    expect(db.writes).toEqual([]);
    expect(db.rows.get("org-one:about")?.published_content).toEqual(liveAbout.published_content);
    expect(db.rows.get("org-one:about")?.published_at).toBe(liveAbout.published_at);
  });

  it("rejects publishing when the database revision changes after the draft read", async () => {
    const db = createDatabase({ pages: [{ ...liveAbout, content: aboutDraft }], bumpRevisionBeforeUpdate: true });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await setStorePagePublished(publicationForm("about", aboutDraft, "publish"));

    expect(result.errors?._form?.[0]).toMatch(/changed.*refresh|refresh.*review/i);
    expect(db.rows.get("org-one:about")).toMatchObject({
      content: { story: "A newer story saved by another tab." },
      published_content: liveAbout.published_content,
      published_at: liveAbout.published_at,
      revision: 2,
    });
    expect(db.writes).toEqual([]);
  });

  it("publishes persisted content when expected preview content matches canonically", async () => {
    const db = createDatabase({ pages: [{ ...liveAbout, content: aboutDraft }] });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await setStorePagePublished(publicationForm("about", { story: `  ${aboutDraft.story}  `, headline: "" }, "publish"));

    expect(result).toEqual({ message: expect.any(String) });
    expect(db.rows.get("org-one:about")?.published_content).toEqual(aboutDraft);
    expect(db.rows.get("org-one:about")?.published_at).toEqual(expect.any(String));
    expect(db.writes[0].values).toMatchObject({ published_content: aboutDraft, published_at: expect.any(String) });
  });

  it("unpublishes without deleting either content snapshot", async () => {
    const db = createDatabase({ pages: [liveAbout] });
    vi.mocked(createClient).mockResolvedValue(db.client as never);

    const result = await setStorePagePublished(pageForm("about", {}, { action: "unpublish" }));

    expect(result.message).toBeDefined();
    expect(db.rows.get("org-one:about")).toMatchObject({
      content: liveAbout.content,
      published_content: liveAbout.published_content,
      published_at: null,
    });
  });
});
