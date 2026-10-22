import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { platformOverviewPages } from "@/views/platform-overview";

const page = platformOverviewPages.overview;

export const metadata = createMetadata({ ...page, path: "/system" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
