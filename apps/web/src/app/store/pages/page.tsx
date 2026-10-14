import { redirect } from "next/navigation";
import { AppShell } from "@/app/_components/app-shell";
import { StorePagesEditor } from "@/app/_components/store-pages-editor";
import { createClient } from "@/lib/supabase/server";
import { storePageTypes, type StorePageType } from "@/lib/store-pages";

export default async function StorePagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id,role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/dashboard");

  const [{ data: store }, { data: pages }] = await Promise.all([
    supabase.from("stores").select("display_name,template").eq("organization_id", membership.organization_id).maybeSingle(),
    supabase.from("store_pages").select("page_type,content,published_content,published_at").eq("organization_id", membership.organization_id),
  ]);

  const pageRows = (pages ?? []).filter((page) => storePageTypes.includes(page.page_type as StorePageType));
  const canEdit = ["owner", "admin", "manager"].includes(membership.role);

  return (
    <AppShell active="/store/pages">
      <StorePagesEditor
        pages={pageRows as { page_type: StorePageType; content: Record<string, unknown>; published_content: Record<string, unknown> | null; published_at: string | null }[]}
        storeName={store?.display_name || "Your shop"}
        templateId={store?.template || "essential"}
        canEdit={canEdit}
      />
    </AppShell>
  );
}
