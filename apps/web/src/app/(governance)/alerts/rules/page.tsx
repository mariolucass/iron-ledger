import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { alertRulePages } from "@/views/governance/alert-rules";

const page = alertRulePages.list;

export const metadata = createMetadata({ ...page, path: "/alerts/rules" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
