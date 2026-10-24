import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { auditEntryPages } from "@/views/governance/audit-entry";

const page = auditEntryPages.detail;

export const metadata = createMetadata({ ...page });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
