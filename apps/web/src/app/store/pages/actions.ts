"use server";

import { revalidatePath } from "next/cache";
import { isStorePageReady, parseStorePageContent, storePageTypes, type StorePageContent, type StorePageType } from "@/lib/store-pages";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
};

type EditorContext =
  | { supabase: Awaited<ReturnType<typeof createClient>>; organizationId: string }
  | { error: ActionState };

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isStorePageType(value: string): value is StorePageType {
  return storePageTypes.some((pageType) => pageType === value);
}

async function requireStorePageEditor(): Promise<EditorContext> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: { error: "Sign in to edit store pages." } };

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("organization_id,role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) {
    return { error: { error: "No business workspace was found for this account." } };
  }
  if (!["owner", "admin", "manager"].includes(membership.role)) {
    return { error: { error: "Your workspace role cannot edit store pages." } };
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("state,trial_started_at,trial_ends_at")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  const active = subscription?.state === "active";
  const trialing = subscription?.state === "trialing" &&
    (!subscription.trial_started_at || (subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() > Date.now()));
  if (subscriptionError || (!active && !trialing)) {
    return { error: { error: "Resolve your workspace plan status before editing store pages." } };
  }

  return { supabase, organizationId: membership.organization_id };
}

function parseDraft(formData: FormData):
  | { ok: true; pageType: StorePageType; content: StorePageContent }
  | { ok: false; action: ActionState } {
  const pageType = formText(formData, "page_type");
  if (!isStorePageType(pageType)) {
    return { ok: false, action: { errors: { page_type: ["Choose a supported store page."] } } };
  }

  let content: unknown;
  try {
    content = JSON.parse(formText(formData, "content"));
  } catch {
    return { ok: false, action: { errors: { content: ["Enter valid page content before saving."] } } };
  }

  const result = parseStorePageContent(pageType, content);
  if (!result.success) return { ok: false, action: { errors: result.errors } };
  return { ok: true, pageType, content: result.data };
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableJson(item)]),
    );
  }
  return value;
}

function canonicalContent(content: StorePageContent) {
  const { pageType: _pageType, ...fields } = content;
  return JSON.stringify(stableJson(fields));
}

export async function saveStorePage(formData: FormData): Promise<ActionState> {
  const draft = parseDraft(formData);
  if (!draft.ok) return draft.action;

  const context = await requireStorePageEditor();
  if ("error" in context) return context.error;

  const { pageType: _validatedPageType, ...content } = draft.content;
  const { error } = await context.supabase.from("store_pages").upsert({
    organization_id: context.organizationId,
    page_type: draft.pageType,
    content,
  }, { onConflict: "organization_id,page_type" });
  if (error) return { error: "The draft could not be saved. Please retry." };

  revalidatePath("/store/pages");
  return { message: "Draft saved. Your published page is unchanged." };
}

export async function setStorePagePublished(formData: FormData): Promise<ActionState> {
  const pageType = formText(formData, "page_type");
  if (!isStorePageType(pageType)) {
    return { errors: { page_type: ["Choose a supported store page."] } };
  }
  const action = formText(formData, "action");
  if (action !== "publish" && action !== "unpublish") {
    return { error: "Choose whether to publish or unpublish this page." };
  }

  let expectedContent: StorePageContent | undefined;
  if (action === "publish") {
    let expectedValue: unknown;
    try {
      expectedValue = JSON.parse(formText(formData, "expected_content"));
    } catch {
      return { errors: { _form: ["Refresh the editor and review the latest draft before publishing."] } };
    }
    const expected = parseStorePageContent(pageType, expectedValue);
    if (!expected.success) return { errors: expected.errors };
    expectedContent = expected.data;
  }

  const context = await requireStorePageEditor();
  if ("error" in context) return context.error;

  const { data: page, error: pageError } = await context.supabase
    .from("store_pages")
    .select("content,revision")
    .eq("organization_id", context.organizationId)
    .eq("page_type", pageType)
    .maybeSingle();
  if (pageError || !page) return { error: "Save a draft for this page before changing its publication status." };

  let update: Record<string, unknown>;
  if (action === "publish") {
    const parsed = parseStorePageContent(pageType, page.content);
    if (!parsed.success) return { errors: parsed.errors };
    if (!expectedContent || canonicalContent(expectedContent) !== canonicalContent(parsed.data)) {
      return { errors: { _form: ["This draft changed in another tab. Refresh the editor and review the latest content before publishing."] } };
    }
    if (!isStorePageReady(pageType, page.content)) {
      return { errors: { _form: ["Complete at least one contact method before publishing this page."] } };
    }
    update = {
      published_content: Object.fromEntries(
        Object.entries(parsed.data).filter(([key]) => key !== "pageType"),
      ),
      published_at: new Date().toISOString(),
    };
  } else {
    update = { published_at: null };
  }

  let updateQuery = context.supabase
    .from("store_pages")
    .update(update)
    .eq("organization_id", context.organizationId)
    .eq("page_type", pageType);
  if (action === "publish") updateQuery = updateQuery.eq("revision", page.revision);
  const { error: updateError, data: updatedPage } = await updateQuery.select("page_type").maybeSingle();
  if (updateError || !updatedPage) {
    if (action === "publish") {
      return { errors: { _form: ["This draft changed in another tab. Refresh the editor and review the latest content before publishing."] } };
    }
    return { error: "The page publication status could not be updated. Please retry." };
  }

  revalidatePath("/store/pages");
  revalidatePath("/s", "layout");
  return { message: action === "publish" ? "Page published." : "Page unpublished. Both content versions are preserved." };
}
