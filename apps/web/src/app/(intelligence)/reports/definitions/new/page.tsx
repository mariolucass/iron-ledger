import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { reportDefinitionPages } from "@/views/report-definitions";

const page = reportDefinitionPages.create;

export const metadata = createMetadata({ ...page, path: "/reports/definitions/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
