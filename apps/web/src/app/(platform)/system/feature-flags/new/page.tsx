import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { featureFlagPages } from "@/views/feature-flags";

const page = featureFlagPages.create;

export const metadata = createMetadata({ ...page, path: "/system/feature-flags/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
