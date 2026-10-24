import { createMetadata } from "@/shared/config/metadata";
import { FeatureFlagEditorPage } from "@/views/platform/platform-data";
import { featureFlagPages } from "@/views/platform/feature-flags";

const page = featureFlagPages.create;

export const metadata = createMetadata({ ...page, path: "/system/feature-flags/new" });

export default function Page() {
  return <FeatureFlagEditorPage />;
}
