import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { auditIntegrityPages } from "@/views/audit-integrity";

const page = auditIntegrityPages.overview;

export const metadata = createMetadata({ ...page, path: "/audit-log/integrity" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
