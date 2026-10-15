import { createFileRoute } from "@tanstack/react-router";
import { MerchantRequests } from "@/components/MerchantRequests";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/campaigns")({ head: () => pageMeta("Campaign requests", "Prepare marketing briefs and review your plan's campaign allowance."), component: CampaignsPage });
function CampaignsPage() { return <MerchantRequests kind="campaigns"/>; }
