import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { featureFlagPages } from "@/views/platform/feature-flags";

const page = featureFlagPages.list;

export const metadata = createMetadata({ ...page, path: "/system/feature-flags" });

export default function Page() {
  return <PlatformPage section="flags" />;
}
