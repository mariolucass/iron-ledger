import { createMetadata } from "@/shared/config/metadata";
import { UserAuditLogPage, userAuditLogPages } from "@/views/identity/user-audit-log";

const page = userAuditLogPages.list;

export const metadata = createMetadata({ ...page, path: "/users/audit-log" });

export default function Page() {
  return <UserAuditLogPage />;
}
