import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { alertRulePages } from "@/views/alert-rules";

const page = alertRulePages.create;

export const metadata = createMetadata({ ...page, path: "/alerts/rules/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
