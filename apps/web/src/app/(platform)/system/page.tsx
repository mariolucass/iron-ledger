import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { platformOverviewPages } from "@/views/platform/platform-overview";

const page = platformOverviewPages.overview;

export const metadata = createMetadata({ ...page, path: "/system" });

export default function Page() {
  return <PlatformPage section="overview" />;
}
