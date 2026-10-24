import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { featureFlagPages } from "@/views/feature-flags";

const page = featureFlagPages.list;

export const metadata = createMetadata({ ...page, path: "/system/feature-flags" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
