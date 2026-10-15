import { createPublicClient } from "@/lib/supabase/public";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = createPublicClient();
  const { data: organization } = client ? await client.from("organizations").select("id,name").eq("slug", slug).maybeSingle() : { data: null };
  const name = organization?.name || "Store";
  return Response.json({ name, short_name: name.slice(0, 24), start_url: `/s/${encodeURIComponent(slug)}`, scope: "/s/", display: "standalone", background_color: "#F8FEFE", theme_color: "#126A73", icons: [{ src: "/store-app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=300" } });
}
