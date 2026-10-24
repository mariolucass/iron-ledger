import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { featureFlagPages } from "@/views/platform/feature-flags";

const page = featureFlagPages.detail;

export const metadata = createMetadata({ ...page });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlatformPage section="flagDetail" id={id} />;
}
