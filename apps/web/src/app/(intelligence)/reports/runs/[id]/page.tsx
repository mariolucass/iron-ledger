import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { reportRunPages } from "@/views/report-runs";

const page = reportRunPages.detail;

export const metadata = createMetadata({ ...page });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
