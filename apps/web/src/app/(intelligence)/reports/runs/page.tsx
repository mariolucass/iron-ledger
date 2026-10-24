import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { reportRunPages } from "@/views/report-runs";

const page = reportRunPages.list;

export const metadata = createMetadata({ ...page, path: "/reports/runs" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
