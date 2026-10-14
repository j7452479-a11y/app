import { StorefrontOrderTracking } from "@/app/_components/storefront-order-tracking";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StorefrontOrderTracking slug={slug} />;
}
