import { createFileRoute } from "@tanstack/react-router";
import { MerchantRequests } from "@/components/MerchantRequests";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/revisions")({ head: () => pageMeta("Design revisions", "Prepare storefront design changes and review your revision allowance."), component: RevisionsPage });
function RevisionsPage() { return <MerchantRequests kind="revisions"/>; }
