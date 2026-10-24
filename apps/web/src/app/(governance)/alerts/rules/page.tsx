import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { alertRulePages } from "@/views/alert-rules";

const page = alertRulePages.list;

export const metadata = createMetadata({ ...page, path: "/alerts/rules" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
