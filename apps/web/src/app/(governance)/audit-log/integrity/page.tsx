import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { auditIntegrityPages } from "@/views/governance/audit-integrity";

const page = auditIntegrityPages.overview;

export const metadata = createMetadata({ ...page, path: "/audit-log/integrity" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
