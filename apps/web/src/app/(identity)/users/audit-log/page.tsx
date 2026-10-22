import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { userAuditLogPages } from "@/views/user-audit-log";

const page = userAuditLogPages.list;

export const metadata = createMetadata({ ...page, path: "/users/audit-log" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
